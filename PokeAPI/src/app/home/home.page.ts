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

import { PokemonService } from '../services/pokemon.service'; // Importe seu serviço de Pokémon

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
  ],
})
export class HomePage implements OnInit { // Implemente OnInit
  pokemons: any[] = []; // Array para armazenar os Pokémons
  offset: number = 0;   // Início da paginação (para a PokeAPI, começa em 0)
  limit: number = 20;   // Quantidade de Pokémons por página
  isLoading: boolean = false; // Para mostrar um indicador de carregamento

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
    this.isLoading = true; // Ativa o indicador de carregamento
    this.pokemonService.getPokemons(this.offset, this.limit).subscribe({
      next: (res: any) => {
        // A API retorna um array de 'results' com nome e URL.
        // Precisamos extrair o ID da URL para formar a URL da imagem.
        this.pokemons = res.results.map((pokemon: any) => {
          // Exemplo de URL: https://pokeapi.co/api/v2/pokemon/1/
          // Usamos filter(Boolean) para remover strings vazias após o split
          const id = pokemon.url.split('/').filter(Boolean).pop();
          return {
            name: pokemon.name,
            url: pokemon.url,
            id: id,
            // URL padrão para sprites de Pokémons (útil para a lista)
            imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
          };
        });
        this.isLoading = false; // Desativa o indicador
      },
      error: (err: any) => {
        console.error('Erro ao carregar Pokémons:', err);
        this.isLoading = false; // Desativa o indicador mesmo em erro
        // Em um app real, você mostraria uma mensagem de erro para o usuário aqui
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
    // Usa o Router para navegar para a rota 'pokemon-details' com o nome como parâmetro
    this.router.navigate(['/pokemon-details', pokemonName]);
  }
}
