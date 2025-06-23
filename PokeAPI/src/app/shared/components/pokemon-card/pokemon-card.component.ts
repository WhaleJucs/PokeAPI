import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrls: ['./pokemon-card.component.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule 
  ]
})
export class PokemonCardComponent {
  @Input() pokemon: any; // Espera um objeto com nome, id, sprite, etc.
  @Output() cardClick = new EventEmitter<string>();
  @Output() favoriteToggled = new EventEmitter<void>();

  onCardClick() {
    this.cardClick.emit(this.pokemon.name);
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    this.favoriteToggled.emit();
  }

  typeColors: { [key: string]: string } = {
    fire: '#F08030',
    water: '#6890F0',
    grass: '#78C850',
    electric: '#F8D030',
    bug: '#A8B820',
    normal: '#A8A878',
    poison: '#A040A0',
    ground: '#E0C068',
    fairy: '#EE99AC',
    fighting: '#C03028',
    psychic: '#F85888',
    rock: '#B8A038',
    ghost: '#705898',
    ice: '#98D8D8',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    flying: '#A890F0'
  };
}