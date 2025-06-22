import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PokemonListResponse, PokemonDetails } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private BASE_URL = 'https://pokeapi.co/api/v2/pokemon';

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

  getPokemonDetails(nameOrId: string | number): Observable<PokemonDetails> {
    return this.http.get<PokemonDetails>(`${this.BASE_URL}/${nameOrId}`);
  }

  getPokemonSpecies(nameOrId: string | number): Observable<any> { 
    return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon-species/${nameOrId}`);
  }

  getEvolutionChain(url: string): Observable<any> { 
    return this.http.get<any>(url);
  }
}