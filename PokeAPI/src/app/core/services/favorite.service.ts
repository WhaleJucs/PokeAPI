import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PokemonData } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private favoritesSubject = new BehaviorSubject<{ name: string; id: number; }[]>([]);
  public favorites$: Observable<{ name: string; id: number; }[]> = this.favoritesSubject.asObservable();

  private favoritePokemonsDetailsSubject = new BehaviorSubject<PokemonData[]>([]);
  public favoritePokemonsDetails$: Observable<PokemonData[]> = this.favoritePokemonsDetailsSubject.asObservable();

  constructor() {
    this.loadFavoritesFromLocalStorage();
  }

  private loadFavoritesFromLocalStorage(): void {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      const parsedFavorites = JSON.parse(storedFavorites);
      this.favoritesSubject.next(parsedFavorites);
      // For favoritePokemonsDetails, we might need to load full details if not stored.
      // For simplicity, we'll assume they are loaded on demand or when toggled.
      // If you need persistence of full details, consider storing them or re-fetching.
    }
  }

  private saveFavoritesToLocalStorage(favorites: { name: string; id: number; }[]): void {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  toggleFavorite(pokemon: PokemonData): void {
    if (!pokemon || pokemon.notLoaded) return;

    const currentFavorites = this.favoritesSubject.getValue();
    const currentFavoriteDetails = this.favoritePokemonsDetailsSubject.getValue();

    const isCurrentlyFavorite = currentFavorites.some(fav => fav.id === pokemon.id);
    pokemon.favorite = !isCurrentlyFavorite; // Update the pokemon object directly

    let updatedFavorites: { name: string; id: number; }[];
    let updatedFavoriteDetails: PokemonData[];

    if (pokemon.favorite) {
      updatedFavorites = [...currentFavorites, { name: pokemon.name, id: pokemon.id }];
      updatedFavoriteDetails = [...currentFavoriteDetails, pokemon];
    } else {
      updatedFavorites = currentFavorites.filter(fav => fav.id !== pokemon.id);
      updatedFavoriteDetails = currentFavoriteDetails.filter(fav => fav.id !== pokemon.id);
    }

    this.favoritesSubject.next(updatedFavorites);
    this.favoritePokemonsDetailsSubject.next(updatedFavoriteDetails);
    this.saveFavoritesToLocalStorage(updatedFavorites);
  }

  isPokemonFavorite(pokemonId: number): boolean {
    return this.favoritesSubject.getValue().some(fav => fav.id === pokemonId);
  }

  // Method to set initial favorite details, e.g., after loading from API
  setInitialFavoriteDetails(details: PokemonData[]): void {
    this.favoritePokemonsDetailsSubject.next(details);
  }
}