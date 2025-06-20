import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // <-- Importe o HttpClient
import { Observable } from 'rxjs'; // <-- Importe Observable para tipagem

@Injectable({
  providedIn: 'root' // Isso faz com que o serviço esteja disponível em toda a aplicação via Injeção de Dependência
})
export class PokemonService {
  private BASE_URL = 'https://pokeapi.co/api/v2/pokemon'; // URL base da PokeAPI

  // Injeta o HttpClient no construtor
  constructor(private http: HttpClient) { } // <-- Adicione a injeção do HttpClient

  /**
   * Busca uma lista de Pokémons da PokeAPI com paginação.
   * @param offset O número de Pokémons a pular.
   * @param limit O número de Pokémons a retornar.
   * @returns Um Observable contendo os dados da lista de Pokémons.
   */
  getPokemons(offset: number = 0, limit: number = 20): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}?offset=${offset}&limit=${limit}`);
  }

  /**
   * Busca os detalhes de um Pokémon específico pelo nome ou ID.
   * @param nameOrId O nome ou ID do Pokémon.
   * @returns Um Observable contendo os dados detalhados do Pokémon.
   */
  getPokemonDetails(nameOrId: string): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/${nameOrId}`);
  }
}
