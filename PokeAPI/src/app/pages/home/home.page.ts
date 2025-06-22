import { Component, OnInit } from '@angular/core';
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
    IonHeader,
    IonToolbar,
    IonTitle,
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
  pokemons: any[] = []; // Pokémons carregados da página atual
  filteredPokemons: any[] = []; // Pokémons exibidos (página ou busca)
  isLoading: boolean = false;
  isLoadingSidebar = false;
  isLoadingDetails = false;
  selectedPokemon: any = null;

  searchTerm: string = '';
  currentIndex: number = 0;
  showOnlyFavorites = false;

  totalPokemons = 1025; // Valor padrão, será atualizado com o count da API
  allPokemonNames: { name: string, id: number }[] = [];

  currentPage = 0;
  pageSize = 150;
  get totalPages() {
    return Math.ceil(this.totalPokemons / this.pageSize);
  }

  constructor(
    private pokemonService: PokemonService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllPokemonNames();
    this.loadPage(0);
  }

  // Carrega todos os nomes/ids para busca global
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

  // Carrega apenas os pokémons da página selecionada
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

  // Filtros e busca
  filterPokemons() {
    let term = this.searchTerm?.toLowerCase() || '';
    let filteredNames = this.allPokemonNames.filter(
      (poke: any) =>
        poke.name.toLowerCase().includes(term) ||
        poke.id.toString().includes(term)
    );

    // Se filtro de favoritos, mantenha só os favoritos já carregados
    if (this.showOnlyFavorites) {
      filteredNames = filteredNames.filter((poke: any) => {
        const loaded = this.pokemons.find(p => p.id === poke.id);
        return loaded && loaded.favorite;
      });
    }

    // Paginação manual: só mostra os 150 da página atual, exceto se estiver pesquisando
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

  // Navegação e seleção
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
        this.pokemons.push(poke); // Adiciona só esse Pokémon
        this.filteredPokemons[index] = poke;
      } finally {
        this.isLoadingDetails = false;
      }
    }

    poke.seen = true;
    const mainIndex = this.pokemons.findIndex(p => p.id === poke.id);
    if (mainIndex !== -1) this.pokemons[mainIndex].seen = true;
  }

  // Favoritos
  toggleFavorite(pokemon: any) {
    pokemon.favorite = !pokemon.favorite;
    // Atualize também no array principal se necessário
    const mainIndex = this.pokemons.findIndex(p => p.id === pokemon.id);
    if (mainIndex !== -1) this.pokemons[mainIndex].favorite = pokemon.favorite;
  }

  // Modal de detalhes
  goToDetails(pokemonName: string) {
    this.selectedPokemon = this.pokemons.find(p => p.name === pokemonName);
  }

  closeDetails() {
    this.selectedPokemon = null;
  }
}
