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
  isLoading: boolean = false;
  selectedPokemon: any = null;

  searchTerm: string = '';
  filteredPokemons: any[] = [];
  currentIndex: number = 0;

  constructor(
    private pokemonService: PokemonService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPokemons();
  }

  loadPokemons() {
    this.isLoading = true;
    // Carrega os 151 primeiros Pokémons (Kanto)
    this.pokemonService.getPokemons(0, 151).subscribe({
      next: (response) => {
        const pokemonsList = response.results.map((poke: any, index: number) => {
          const id = index + 1;
          return {
            ...poke,
            id,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
          };
        });

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
          this.isLoading = false;
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  goToDetails(pokemonName: string) {
    this.selectedPokemon = this.pokemons.find(p => p.name === pokemonName);
  }

  closeDetails() {
    this.selectedPokemon = null;
  }

  filterPokemons() {
    const term = this.searchTerm.toLowerCase();
    this.filteredPokemons = this.pokemons.filter(
      (poke: any) =>
        poke.name.toLowerCase().includes(term) ||
        poke.id.toString().includes(term)
    );
    this.currentIndex = 0;
  }

  prevCard() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextCard() {
    if (this.currentIndex < this.filteredPokemons.length - 1) this.currentIndex++;
  }

  selectCard(index: number) {
    this.currentIndex = index;
    const poke = this.filteredPokemons[index];
    poke.seen = true;
    // Também marca no array principal, se necessário:
    const mainIndex = this.pokemons.findIndex(p => p.id === poke.id);
    if (mainIndex !== -1) this.pokemons[mainIndex].seen = true;
  }
}
