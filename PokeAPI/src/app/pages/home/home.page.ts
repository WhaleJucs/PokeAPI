import { Component, OnInit } from '@angular/core'; // Importe OnInit
import { Router } from '@angular/router'; // Importe Router para navegação
import { CommonModule } from '@angular/common'; // Importe CommonModule para *ngIf e *ngFor


// Importações de componentes e módulos do Ionic para Standalone Components
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner, // Para o indicador de carregamento
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonFooter, // Para os botões de paginação no rodapé
  IonButtons // Para agrupar botões no toolbar
} from '@ionic/angular/standalone';

import { PokemonService } from '../../core/services/pokemon.service'; // Importe seu serviço de Pokémon
import { PokemonCardComponent } from '../../shared/components/pokemon-card/pokemon-card.component'; // Importe o componente PokemonCard
import { PokemonDetailsModalComponent } from '../../shared/components/pokemon-details-modal/pokemon-details-modal.component'; // Importe o componente PokemonDetailsModal

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
    IonSpinner, // Adicionado
    IonGrid,    // Adicionado
    IonRow,     // Adicionado
    IonCol,     // Adicionado
    IonCard,    // Adicionado
    IonCardHeader, // Adicionado
    IonCardTitle,  // Adicionado
    IonCardContent, // Adicionado
    IonButton,      // Adicionado
    IonFooter,      // Adicionado
    IonButtons,     // Adicionado
    CommonModule,   // **Essencial para *ngIf, *ngFor**
    PokemonCardComponent, // Adicionado o componente PokemonCard
    PokemonDetailsModalComponent, // Adicionado o componente PokemonDetailsModal
  ],
})
export class HomePage implements OnInit { // Implemente OnInit
  pokemons: any[] = []; // Array para armazenar os Pokémons
  offset: number = 0;   // Início da paginação (para a PokeAPI, começa em 0)
  limit: number = 20;   // Quantidade de Pokémons por página
  isLoading: boolean = false; // Para mostrar um indicador de carregamento
  selectedPokemon: any = null;

  // Injeção de Dependência: o Angular fornece instâncias de PokemonService e Router
  constructor(
    private pokemonService: PokemonService,
    private router: Router // Injetando o Router para navegação
  ) {}

  ngOnInit() {
    this.loadPokemons(); // Carrega os Pokémons quando a página é inicializada
  }

  /**
   * Carrega a lista de Pokémons da PokeAPI.
   */
  loadPokemons() {
    this.isLoading = true;
    this.pokemonService.getPokemons(this.offset, this.limit).subscribe({
      next: (response) => {
        const pokemonsList = response.results.map((poke: any, index: number) => {
          const id = this.offset + index + 1;
          return {
            ...poke,
            id,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
          };
        });

        // Limite o número de requisições paralelas
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
          this.isLoading = false;
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Avança para a próxima página de Pokémons.
   */
  nextPage() {
    this.offset += this.limit;
    this.loadPokemons();
  }

  /**
   * Volta para a página anterior de Pokémons.
   */
  prevPage() {
    if (this.offset >= this.limit) {
      this.offset -= this.limit;
      this.loadPokemons();
    }
  }

  /**
   * Navega para a tela de detalhes de um Pokémon específico.
   * @param pokemonName O nome do Pokémon para navegar.
   */
  goToDetails(pokemonName: string) {
    this.selectedPokemon = this.pokemons.find(p => p.name === pokemonName);
  }

  closeDetails() {
    this.selectedPokemon = null;
  }
}
