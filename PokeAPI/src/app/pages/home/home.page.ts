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
  pokemons: any[] = [];
  filteredPokemons: any[] = [];
  isLoading: boolean = false;
  isLoadingSidebar = false;
  isLoadingDetails = false;
  selectedPokemon: any = null;

  searchTerm: string = '';
  currentIndex: number = 0;
  showOnlyFavorites = false;

  offset = 0;
  limit = 150;
  totalPokemons = 1025; // Valor padrão, será atualizado com o count da API
  allLoaded = false;
  allPokemonNames: { name: string, id: number }[] = [];

  constructor(
    private pokemonService: PokemonService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllPokemonNames();
    this.loadPokemons();
  }

  // Carrega todos os pokémons na inicialização
  loadPokemons() {
    this.isLoading = true;
    this.pokemonService.getPokemons(0, this.limit).subscribe({
      next: (response) => {
        if (response.count) this.totalPokemons = response.count;

        const pokemonsList = response.results.map((poke: any, index: number) => {
          // Extrai o id real da URL
          const match = poke.url.match(/\/pokemon\/(\d+)\//);
          const id = match ? Number(match[1]) : null;
          return {
            ...poke,
            id,
            sprite: id
              ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
              : ''
          };
        }).filter((poke: any) => poke.id && poke.id <= this.totalPokemons);

        Promise.all(
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
        ).then((pokemonsWithTypes) => {
          this.pokemons = pokemonsWithTypes;
          this.filteredPokemons = this.pokemons;
          this.offset = this.pokemons.length;
          this.isLoading = false;
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Carrega o próximo lote de pokémons (infinite scroll)
  loadNextBatch() {
    if (this.isLoadingSidebar || this.allLoaded) return;
    this.isLoadingSidebar = true;

    if (this.pokemons.length >= this.totalPokemons) {
      this.isLoadingSidebar = false;
      this.allLoaded = true;
      return;
    }

    this.pokemonService.getPokemons(this.offset, this.limit).subscribe({
      next: (response) => {
        // Atualiza o totalPokemons se a API retornar o count
        if (response.count) this.totalPokemons = response.count;

        const remaining = this.totalPokemons - this.pokemons.length;
        const results = response.results.slice(0, remaining);

        const pokemonsList = results
          .map((poke: any) => {
            // Extrai o id real da URL
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
          .filter((poke: any) => poke.id && poke.id <= this.totalPokemons); // <-- só até 1025

        if (pokemonsList.length === 0) {
          this.isLoadingSidebar = false;
          this.allLoaded = true;
          return;
        }

        Promise.all(
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
        ).then((pokemonsWithTypes) => {
          this.pokemons = [...this.pokemons, ...pokemonsWithTypes];
          this.offset = this.pokemons.length;
          this.filterPokemons();
          this.isLoadingSidebar = false;
          if (this.pokemons.length >= this.totalPokemons) {
            this.allLoaded = true;
          }
        }).catch(() => {
          this.isLoadingSidebar = false;
        });
      },
      error: () => {
        this.isLoadingSidebar = false;
      }
    });
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

    if (poke.notLoaded) {
      this.isLoadingDetails = true; // Inicia o loader

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
      } finally {
        this.isLoadingDetails = false; // Finaliza o loader
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
}
