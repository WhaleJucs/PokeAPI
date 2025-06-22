import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner } from '@ionic/angular/standalone';

import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonCardComponent } from '../../shared/components/pokemon-card/pokemon-card.component';
import { PokemonDetailsModalComponent } from '../../shared/components/pokemon-details-modal/pokemon-details-modal.component';
import { PokedexSidebarComponent } from '../../shared/components/pokedex-sidebar/pokedex-sidebar.component';

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
export class HomePage implements OnInit {
  pokemons: any[] = [];
  filteredPokemons: any[] = [];
  isLoading: boolean = false;
  isLoadingSidebar = false;
  isLoadingDetails = false;
  selectedPokemon: any = null;

  searchTerm: string = '';
  currentIndex: number = 0;
  showOnlyFavorites = false;

  totalPokemons = 1025;
  allPokemonNames: { name: string, id: number }[] = [];

  currentPage = 0;
  pageSize = 150;
  get totalPages() {
    return Math.ceil(this.totalPokemons / this.pageSize);
  }

  favorites: { name: string, id: number }[] = [];
  favoritePokemonsDetails: any[] = []; // Detalhes completos dos favoritos

  constructor(
    private pokemonService: PokemonService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllPokemonNames();
    this.loadPage(0);
  }

  loadAllPokemonNames() {
    this.pokemonService.getPokemons(0, this.totalPokemons).subscribe({
      next: (response) => {
        this.allPokemonNames = response.results
          .map((poke: any) => {
            const match = poke.url.match(/\/pokemon\/(\d+)\//);
            const id = match ? Number(match[1]) : null;
            return { name: poke.name, id };
          })
          .filter((poke: any) => poke.id && poke.id <= this.totalPokemons);
      }
    });
  }

  async loadPage(page: number) {
    this.isLoadingSidebar = true;
    this.currentPage = page;
    const apiOffset = page * this.pageSize;

    const response: any = await this.pokemonService.getPokemons(apiOffset, this.pageSize).toPromise();

    const pokemonsList = response.results
      .map((poke: any) => {
        const match = poke.url.match(/\/pokemon\/(\d+)\//);
        const id = match ? Number(match[1]) : null;
        return {
          ...poke,
          id,
          sprite: id
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            : ''
        };
      })
      .filter((poke: any) => poke.id && poke.id <= this.totalPokemons);

    const pokemonsWithTypes = await Promise.all(
      pokemonsList.map(async (poke: any) => {
        try {
          const details = await this.pokemonService.getPokemonDetails(poke.name).toPromise();
          return {
            ...poke,
            types: details.types.map((t: any) => t.type.name),
            height: details.height,
            weight: details.weight
          };
        } catch {
          return poke;
        }
      })
    );

    this.pokemons = pokemonsWithTypes;
    this.filterPokemons();
    this.isLoadingSidebar = false;
  }

  filterPokemons() {
    let term = this.searchTerm?.toLowerCase() || '';
    let filteredNames = this.allPokemonNames.filter(
      (poke: any) =>
        poke.name.toLowerCase().includes(term) ||
        poke.id.toString().includes(term)
    );

    // Se filtro de favoritos, use detalhes globais dos favoritos
    if (this.showOnlyFavorites) {
      this.filteredPokemons = this.favorites.map(fav => {
        const loaded = this.favoritePokemonsDetails.find(p => p.id === fav.id);
        return loaded || { ...fav, notLoaded: true };
      });
      this.currentIndex = 0;
      return;
    }

    // Paginação manual: só mostra os da página atual, exceto se estiver pesquisando
    if (!this.searchTerm) {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      filteredNames = filteredNames.slice(start, end);
    }

    // Para cada resultado, se já carregado, usa o objeto completo, senão cria um "placeholder"
    this.filteredPokemons = filteredNames.map((poke: any) => {
      const loaded = this.pokemons.find(p => p.id === poke.id);
      return loaded || { ...poke, notLoaded: true };
    });

    this.currentIndex = 0;
  }

  toggleFavoriteFilter() {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.filterPokemons();
  }

  prevCard() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextCard() {
    if (this.currentIndex < this.filteredPokemons.length - 1) this.currentIndex++;
  }

  async selectCard(index: number) {
    this.currentIndex = index;
    let poke = this.filteredPokemons[index];

    // Busca detalhes sob demanda se não carregado
    if (poke.notLoaded) {
      this.isLoadingDetails = true;
      try {
        const details = await this.pokemonService.getPokemonDetails(poke.name).toPromise();
        poke = {
          ...poke,
          types: details.types.map((t: any) => t.type.name),
          height: details.height,
          weight: details.weight,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`
        };
        this.pokemons.push(poke);
        this.filteredPokemons[index] = poke;
        // Se for favorito, atualize detalhes globais
        if (poke.favorite && !this.favoritePokemonsDetails.find(f => f.id === poke.id)) {
          this.favoritePokemonsDetails.push({ ...poke });
        }
      } finally {
        this.isLoadingDetails = false;
      }
    }

    poke.seen = true;
    const mainIndex = this.pokemons.findIndex(p => p.id === poke.id);
    if (mainIndex !== -1) this.pokemons[mainIndex].seen = true;
  }

  toggleFavorite(pokemon: any) {
    pokemon.favorite = !pokemon.favorite;
    const mainIndex = this.pokemons.findIndex(p => p.id === pokemon.id);
    if (mainIndex !== -1) this.pokemons[mainIndex].favorite = pokemon.favorite;

    if (pokemon.favorite) {
      // Adiciona aos favoritos se não existir
      if (!this.favorites.find(fav => fav.id === pokemon.id)) {
        this.favorites.push({ name: pokemon.name, id: pokemon.id });
      }
      // Adiciona detalhes se não existir
      if (!this.favoritePokemonsDetails.find(fav => fav.id === pokemon.id)) {
        this.favoritePokemonsDetails.push({ ...pokemon });
      }
    } else {
      // Remove dos favoritos
      this.favorites = this.favorites.filter(fav => fav.id !== pokemon.id);
      this.favoritePokemonsDetails = this.favoritePokemonsDetails.filter(fav => fav.id !== pokemon.id);
    }
    // Atualiza a lista filtrada se estiver no modo favoritos
    if (this.showOnlyFavorites) {
      this.filterPokemons();
    }
  }

  goToDetails(pokemonName: string) {
    this.selectedPokemon = this.pokemons.find(p => p.name === pokemonName)
      || this.favoritePokemonsDetails.find(p => p.name === pokemonName);
  }

  closeDetails() {
    this.selectedPokemon = null;
  }
}
