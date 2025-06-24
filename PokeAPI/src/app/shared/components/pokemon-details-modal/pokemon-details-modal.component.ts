import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../../core/services/pokemon.service'; 
import { FormatNamePipe } from '../../pipes/format-name.pipe';

@Component({
  selector: 'app-pokemon-details-modal',
  templateUrl: './pokemon-details-modal.component.html',
  styleUrls: ['./pokemon-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormatNamePipe,]
})
export class PokemonDetailsModalComponent implements OnChanges {
  @Input() pokemon: any;
  @Output() close = new EventEmitter<void>();

  description: string = '';
  evolutionLine: any[] = [];

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

  constructor(private pokemonService: PokemonService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pokemon'] && this.pokemon) {
      this.loadSpeciesAndEvolution();
    }
  }

  async loadSpeciesAndEvolution() {
    const species = await this.pokemonService.getPokemonSpecies(this.pokemon.name).toPromise();
    const entry = species.flavor_text_entries.find(
      (e: any) => e.language.name === 'pt' || e.language.name === 'pt-BR'
    ) || species.flavor_text_entries.find(
      (e: any) => e.language.name === 'en'
    );
    this.description = entry ? entry.flavor_text.replace(/\f/g, ' ') : 'Descrição não encontrada.';

    // Busca cadeia evolutiva
    if (species.evolution_chain?.url) {
      const chain = await this.pokemonService.getEvolutionChain(species.evolution_chain.url).toPromise();
      this.evolutionLine = this.parseEvolutionChain(chain.chain);
    }
  }

  // Função recursiva para montar a linha evolutiva
  parseEvolutionChain(chain: any, evolutions: string[] = []): string[] {
    evolutions.push(chain.species.name);
    if (chain.evolves_to && chain.evolves_to.length > 0) {
      return this.parseEvolutionChain(chain.evolves_to[0], evolutions);
    }
    return evolutions;
  }

  onClose() {
    this.close.emit();
  }
}