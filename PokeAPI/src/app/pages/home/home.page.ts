import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { Subject, forkJoin, of, Observable, BehaviorSubject } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';

import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonCardComponent } from '../../shared/components/pokemon-card/pokemon-card.component';
import { PokemonDetailsModalComponent } from '../../shared/components/pokemon-details-modal/pokemon-details-modal.component';
import { PokedexSidebarComponent } from '../../shared/components/pokedex-sidebar/pokedex-sidebar.component';
import { PokemonData, PokemonDetails } from '../../core/models/pokemon.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonSpinner,
    FormsModule,
    CommonModule,
    PokemonCardComponent,
    PokemonDetailsModalComponent,
    PokedexSidebarComponent,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // --- Propriedades Reativas ---
  private pokemonSource = new BehaviorSubject<PokemonData[]>([]);
  public filteredPokemons$: Observable<PokemonData[]> = this.pokemonSource.asObservable();

  // --- Propriedades de Estado da UI ---
  public isLoading: boolean = true; // Inicia como true
  public isLoadingSidebar = false;
  public isLoadingDetails = false;
  public selectedPokemon: PokemonData | null = null;
  public searchTerm: string = '';
  public currentIndex: number = 0;
  public showOnlyFavorites = false;

  // --- Propriedades de Suporte e Cache ---
  private pokemonsOnPage: PokemonData[] = []; // Cache dos pokémons da página atual
  public totalPokemons = 1025;
  public allPokemonNames: { name: string; id: number }[] = [];
  public currentPage = 0;
  public pageSize = 150;
  public get totalPages() { return Math.ceil(this.totalPokemons / this.pageSize); }
  public favorites: { name: string; id: number }[] = [];
  public favoritePokemonsDetails: PokemonData[] = [];

  constructor(private pokemonService: PokemonService) {}

  ngOnInit() {
    this.loadAllPokemonNames();
    this.loadPage(0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllPokemonNames() {
    this.pokemonService.getPokemons(0, this.totalPokemons)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allPokemonNames = response.results.map((poke) => {
            const match = poke.url.match(/\/pokemon\/(\d+)\//);
            const id = match ? Number(match[1]) : 0;
            return { name: poke.name, id };
          }).filter((poke) => poke.id && poke.id <= this.totalPokemons);
        }
      });
  }

  loadPage(page: number) {
    this.isLoadingSidebar = true;
    this.currentPage = page;
    const apiOffset = page * this.pageSize;

    this.pokemonService.getPokemons(apiOffset, this.pageSize).pipe(
      switchMap(response => {
        if (!response.results.length) return of([]);
        const detailRequests = response.results.map(poke =>
          this.pokemonService.getPokemonDetails(Number(poke.url.split('/')[6])).pipe(
            map(details => (details ? this.mapToPokemonData(details) : null))
          )
        );
        return forkJoin(detailRequests);
      }),
      map(pokemons => pokemons.filter(p => p !== null) as PokemonData[]),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (detailedPokemons) => {
        this.pokemonsOnPage = detailedPokemons; // Atualiza o cache da página
        this.filterPokemons(); // Roda o filtro, que emitirá os dados para a tela
        this.isLoading = false;
        this.isLoadingSidebar = false;
      },
      error: (err) => {
        console.error("Erro ao carregar página:", err);
        this.isLoading = false;
        this.isLoadingSidebar = false;
      }
    });
  }

  private mapToPokemonData(details: PokemonDetails): PokemonData {
    return {
      id: details.id,
      name: details.name,
      sprite: details.sprites.other?.['official-artwork']?.front_default || details.sprites.front_default,
      types: details.types.map(t => t.type.name),
      height: details.height,
      weight: details.weight,
    };
  }

  filterPokemons() {
    let results: PokemonData[] = [];
    if (this.showOnlyFavorites) {
      results = this.favoritePokemonsDetails;
    } else if (!this.searchTerm) {
      results = this.pokemonsOnPage; // Mostra apenas os pokémons da página atual
    } else {
      const term = this.searchTerm.toLowerCase();
      const filteredNames = this.allPokemonNames.filter(
        (poke) => poke.name.toLowerCase().includes(term) || poke.id.toString().includes(term)
      );
      results = filteredNames.map((pokeRef) => {
        // Procura nos pokémons já carregados nesta página
        const loaded = this.pokemonsOnPage.find(p => p.id === pokeRef.id);
        return loaded || { id: pokeRef.id, name: pokeRef.name, notLoaded: true };
      });
    }
    this.currentIndex = 0;
    this.pokemonSource.next(results); // Emite o resultado para o Observable que a tela está escutando
  }

  async selectCard(index: number) {
    this.currentIndex = index;
    const currentList = this.pokemonSource.getValue();
    let poke = currentList[index];

    if (poke.notLoaded) {
      this.isLoadingDetails = true;
      try {
        const details = await this.pokemonService.getPokemonDetails(poke.name).toPromise();
        if (details) {
          const mappedPoke = this.mapToPokemonData(details);
          mappedPoke.seen = true;
          // Atualiza a lista de forma imutável
          const updatedList = currentList.map(p => p.id === mappedPoke.id ? mappedPoke : p);
          this.pokemonSource.next(updatedList);
        }
      } catch (error) {
        console.error("Falha ao buscar detalhes do Pokémon", error);
      } finally {
        this.isLoadingDetails = false;
      }
    } else {
        poke.seen = true;
        const updatedList = [...currentList]; // Cria nova referência do array
        this.pokemonSource.next(updatedList);
    }
  }

  goToDetails(pokemonName: string) {
    this.selectedPokemon = this.pokemonSource.getValue().find(p => p.name === pokemonName) || null;
  }

  closeDetails() {
    this.selectedPokemon = null;
  }

  toggleFavoriteFilter() {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.filterPokemons();
  }

  prevCard() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextCard() {
    const currentLength = this.pokemonSource.getValue().length;
    if (this.currentIndex < currentLength - 1) this.currentIndex++;
  }

  toggleFavorite(pokemon: PokemonData) {
    const isFavorite = !pokemon.favorite;
    
    if (isFavorite) {
        if (!this.favorites.find(fav => fav.id === pokemon.id)) {
            this.favorites.push({ name: pokemon.name, id: pokemon.id });
        }
        if (!this.favoritePokemonsDetails.find(fav => fav.id === pokemon.id)) {
            this.favoritePokemonsDetails.push({ ...pokemon, favorite: true });
        }
    } else {
        this.favorites = this.favorites.filter(fav => fav.id !== pokemon.id);
        this.favoritePokemonsDetails = this.favoritePokemonsDetails.filter(fav => fav.id !== pokemon.id);
    }

    // Atualiza o item na lista principal de forma imutável
    const updatedList = this.pokemonSource.getValue().map(p => {
        if (p.id === pokemon.id) {
            return { ...p, favorite: isFavorite };
        }
        return p;
    });

    this.pokemonSource.next(updatedList);

    if (this.showOnlyFavorites) {
        this.filterPokemons();
    }
  }
}