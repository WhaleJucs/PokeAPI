import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators'; // <<< MUDANÇA 1: Importamos o 'tap'
import { PokemonListResponse, PokemonDetails } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private BASE_URL = 'https://pokeapi.co/api/v2/pokemon';

  // <<< MUDANÇA 2: Adicionamos a propriedade para o cache >>>
  private detailsCache = new Map<string | number, PokemonDetails>();

  constructor(private http: HttpClient) { }

  // Esta função não muda, permanece como está no seu arquivo
  getPokemons(offset: number = 0, limit: number = 20): Observable<PokemonListResponse> {
    return this.http.get<PokemonListResponse>(`${this.BASE_URL}?offset=${offset}&limit=${limit}`)
      .pipe(
        catchError(error => {
          console.error('Ocorreu um erro ao buscar os Pokémons:', error);
          return throwError(() => new Error('Falha ao carregar os dados. Tente novamente mais tarde.'));
        })
      );
  }

  // <<< MUDANÇA 3: A lógica de cache é adicionada a esta função >>>
  getPokemonDetails(nameOrId: string | number): Observable<PokemonDetails | null> {
    // Passo A: Verificar se o dado já existe no cache
    if (this.detailsCache.has(nameOrId)) {
      return of(this.detailsCache.get(nameOrId)!); // Retorna o dado do cache imediatamente
    }

    // Passo B: Se não existe no cache, busca na API
    return this.http.get<PokemonDetails>(`${this.BASE_URL}/${nameOrId}`).pipe(
      // Passo C: Usamos o 'tap' para salvar o resultado no cache antes de retorná-lo
      tap(details => {
        if (details) {
          this.detailsCache.set(nameOrId, details);
        }
      }),
      // O seu tratamento de erro original continua aqui
      catchError(error => {
        console.error(`Erro ao buscar detalhes para ${nameOrId}:`, error);
        return of(null);
      })
    );
  }

  // Estas funções não mudam
  getPokemonSpecies(nameOrId: string | number): Observable<any> {
    return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon-species/${nameOrId}`);
  }

  getEvolutionChain(url: string): Observable<any> {
    return this.http.get<any>(url);
  }
}