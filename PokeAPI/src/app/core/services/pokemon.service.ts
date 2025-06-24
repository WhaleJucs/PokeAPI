import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PokemonListResponse, PokemonDetails, PokemonData } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private BASE_URL = 'https://pokeapi.co/api/v2/pokemon';

  private detailsCache = new Map<string | number, PokemonDetails>();

  constructor(private http: HttpClient) { }

  getPokemons(offset: number = 0, limit: number = 20): Observable<PokemonListResponse> {
    return this.http.get<PokemonListResponse>(`${this.BASE_URL}?offset=${offset}&limit=${limit}`)
      .pipe(
        catchError(error => {
          console.error('Ocorreu um erro ao buscar os Pokémons:', error);
          return throwError(() => new Error('Falha ao carregar os dados. Tente novamente mais tarde.'));
        })
      );
  }
  getPokemonDetails(nameOrId: string | number): Observable<PokemonDetails | null> {

    if (this.detailsCache.has(nameOrId)) {
      return of(this.detailsCache.get(nameOrId)!); // Retorna o dado do cache imediatamente
    }

    return this.http.get<PokemonDetails>(`${this.BASE_URL}/${nameOrId}`).pipe(
      tap(details => {
        if (details) {
          this.detailsCache.set(nameOrId, details);
        }
      }),
      catchError(error => {
        console.error(`Erro ao buscar detalhes para ${nameOrId}:`, error);
        return of(null);
      })
    );
  }

  public mapToPokemonData(details: PokemonDetails): PokemonData {
    return {
      id: details.id,
      name: details.name,
      sprite: details.sprites.other?.['official-artwork']?.front_default || details.sprites.front_default,
      types: details.types.map(t => t.type.name),
      height: details.height,
      weight: details.weight,
      stats: details.stats,
      abilities: details.abilities,
      notLoaded: false
    };
  }

  getPokemonSpecies(nameOrId: string | number): Observable<any> {
    return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon-species/${nameOrId}`);
  }

  getEvolutionChain(url: string): Observable<any> {
    return this.http.get<any>(url);
  }
}