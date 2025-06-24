import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner, IonLabel, IonToggle, IonModal, Platform } from '@ionic/angular/standalone';
import { Subject, Observable, BehaviorSubject, of } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
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
    IonContent, IonSpinner, FormsModule, CommonModule, PokemonCardComponent,
    PokemonDetailsModalComponent, PokedexSidebarComponent, IonLabel, IonToggle, IonModal,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private pokemonSource = new BehaviorSubject<PokemonData[]>([]);
  public filteredPokemons$: Observable<PokemonData[]> = this.pokemonSource.asObservable();

  public isLoadingPage: boolean = true;
  public isCardLoading: boolean = false;
  public selectedPokemon: PokemonData | null = null;
  public searchTerm: string = '';
  public currentIndex: number = 0;
  public showOnlyFavorites = false;
  public isDarkMode: boolean = false;
  public isSidebarModalOpen = false;
  public isDesktop = false;

  private pokemonsOnPage: PokemonData[] = [];
  public totalPokemons = 1025;
  public currentPage = 0;
  public pageSize = 150;
  public get totalPages() { return Math.ceil(this.totalPokemons / this.pageSize); }
  public allPokemonNames: { name: string; id: number; }[] = [];
  public favorites: { name: string; id: number; }[] = [];
  public favoritePokemonsDetails: PokemonData[] = [];

  constructor(private pokemonService: PokemonService, private platform: Platform) {
    this.initializeTheme();
    this.checkPlatform();
    this.platform.resize.subscribe(() => this.checkPlatform());
  }

  ngOnInit() {
    this.loadAllPokemonNames();
    this.loadPage(0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- LÓGICA DE CARREGAMENTO E NAVEGAÇÃO (Já funcional) ---

  loadPage(page: number, goToLast: boolean = false) {
    this.isLoadingPage = true;
    this.currentPage = page;
    const apiOffset = page * this.pageSize;

    this.pokemonService.getPokemons(apiOffset, this.pageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const placeholderPokemons: PokemonData[] = response.results.map(p => {
          const id = Number(p.url.split('/')[6]);
          return { id, name: p.name, notLoaded: true };
        });
        
        this.pokemonsOnPage = placeholderPokemons; // Guarda a página atual "original"
        this.pokemonSource.next(placeholderPokemons);
        this.currentIndex = goToLast ? placeholderPokemons.length - 1 : 0;
        this.loadCardDetails(this.currentIndex);
        this.isLoadingPage = false;
      },
      error: (err) => {
        console.error("Erro ao carregar a lista de Pokémons:", err);
        this.isLoadingPage = false;
      }
    });
  }

  loadCardDetails(index: number) {
    const pokemons = this.pokemonSource.getValue();
    const targetPokemon = pokemons[index];

    if (!targetPokemon || !targetPokemon.notLoaded) {
      this.isCardLoading = false;
      return;
    }

    this.isCardLoading = true;
    this.pokemonService.getPokemonDetails(targetPokemon.id).pipe(takeUntil(this.destroy$)).subscribe(details => {
      if (details) {
        const detailedPokemon = this.mapToPokemonData(details);
        detailedPokemon.favorite = this.favorites.some(fav => fav.id === detailedPokemon.id);
        
        const updatedPokemons = [...pokemons];
        updatedPokemons[index] = detailedPokemon;
        this.pokemonSource.next(updatedPokemons);
      }
      this.isCardLoading = false;
    });
  }
  
  public prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadCardDetails(this.currentIndex);
    } else if (this.currentPage > 0) {
      this.loadPage(this.currentPage - 1, true);
    }
  }

  public nextCard() {
    const pokemons = this.pokemonSource.getValue();
    if (this.currentIndex < pokemons.length - 1) {
      this.currentIndex++;
      this.loadCardDetails(this.currentIndex);
    } else if (this.currentPage < this.totalPages - 1) {
      this.loadPage(this.currentPage + 1);
    }
  }

  public selectCard(index: number) {
    this.currentIndex = index;
    this.loadCardDetails(this.currentIndex);
  }

  // --- FUNÇÕES CORRIGIDAS ---

  /**
   * CORREÇÃO 1: Lógica do Dark Mode simplificada para evitar o bug de 2 cliques.
   */
  public toggleTheme(): void {
    // A variável 'this.isDarkMode' já foi atualizada pelo [(ngModel)].
    // Apenas aplicamos os efeitos colaterais.
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  /**
   * CORREÇÃO 2: Lógica de favoritos agora atualiza a lista de detalhes.
   */
  public toggleFavorite(pokemon: PokemonData): void {
    if (!pokemon || pokemon.notLoaded) return; // Não favoritar placeholders

    const isCurrentlyFavorite = this.favorites.some(fav => fav.id === pokemon.id);
    pokemon.favorite = !isCurrentlyFavorite;

    if (pokemon.favorite) {
      this.favorites.push({ name: pokemon.name, id: pokemon.id });
      this.favoritePokemonsDetails.push(pokemon);
    } else {
      this.favorites = this.favorites.filter(fav => fav.id !== pokemon.id);
      this.favoritePokemonsDetails = this.favoritePokemonsDetails.filter(fav => fav.id !== pokemon.id);
    }
    
    // Se o filtro de favoritos estiver ativo, atualiza a lista na tela
    if (this.showOnlyFavorites) {
      this.filterPokemons();
    } else {
       // Senão, apenas força a atualização do estado do card atual
      this.pokemonSource.next([...this.pokemonSource.getValue()]);
    }
  }

  /**
   * CORREÇÃO 3: Lógica completa de filtro e busca restaurada e adaptada.
   */
  public filterPokemons(): void {
    // Se o filtro de favoritos estiver ativo, ele tem prioridade.
    if (this.showOnlyFavorites) {
      this.pokemonSource.next(this.favoritePokemonsDetails);
      this.currentIndex = 0;
      if(this.favoritePokemonsDetails.length > 0) this.loadCardDetails(0);
      return;
    }

    // Se a busca estiver vazia, restaura a lista da página atual.
    if (!this.searchTerm) {
      this.pokemonSource.next(this.pokemonsOnPage);
      this.currentIndex = 0;
      this.loadCardDetails(0);
      return;
    }

    // Se há um termo de busca, filtra a lista MESTRA de todos os nomes.
    const term = this.searchTerm.toLowerCase();
    const filteredNames = this.allPokemonNames.filter(
      (poke) => poke.name.toLowerCase().includes(term) || poke.id.toString().startsWith(term)
    );

    // Cria uma lista de placeholders com base nos resultados da busca.
    const searchResults: PokemonData[] = filteredNames.map((pokeRef) => {
      return { id: pokeRef.id, name: pokeRef.name, notLoaded: true };
    });

    this.pokemonSource.next(searchResults);
    this.currentIndex = 0;
    if(searchResults.length > 0) this.loadCardDetails(0);
  }
  
  // --- Funções de Suporte (sem alterações) ---

  public loadAllPokemonNames(): void {
    this.pokemonService.getPokemons(0, this.totalPokemons).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.allPokemonNames = response.results.map((poke) => {
          const match = poke.url.match(/\/pokemon\/(\d+)\//);
          const id = match ? Number(match[1]) : 0;
          return { name: poke.name, id };
        }).filter((poke) => poke.id && poke.id <= this.totalPokemons);
      }
    });
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
      this.isDarkMode = true;
      document.body.classList.add('dark');
    }
  }

  private checkPlatform() {
    this.isDesktop = this.platform.width() > 768;
  }

  public setOpenSidebar(isOpen: boolean) {
    this.isSidebarModalOpen = isOpen;
  }

  public get isCurrentPokemonFavorite(): boolean {
    const pokemons = this.pokemonSource.getValue();
    const currentPokemon = pokemons[this.currentIndex];
    if (!currentPokemon) return false;
    return this.favorites.some(fav => fav.id === currentPokemon.id);
  }

  private mapToPokemonData(details: PokemonDetails): PokemonData {
    return {
      id: details.id,
      name: details.name,
      sprite: details.sprites.other?.['official-artwork']?.front_default || details.sprites.front_default,
      types: details.types.map(t => t.type.name),
      height: details.height,
      weight: details.weight,
      stats: (details as any).stats,
      abilities: (details as any).abilities,
      notLoaded: false
    };
  }
  
  public toggleFavoriteFilter(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.filterPokemons();
  }

  public goToDetails(pokemonName: string): void {
    const pokemon = this.pokemonSource.getValue().find(p => p.name === pokemonName);
    this.selectedPokemon = pokemon || null;
  }
  
  public closeDetails(): void {
    this.selectedPokemon = null;
  }
}