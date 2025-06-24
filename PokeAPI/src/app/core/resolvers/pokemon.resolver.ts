import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PokemonService } from '../services/pokemon.service';
import { PokemonData } from '../models/pokemon.model';

export const pokemonResolver: ResolveFn<PokemonData | null> = (
  route: ActivatedRouteSnapshot
): Observable<PokemonData | null> => {
  const pokemonService = inject(PokemonService);
  const id = route.paramMap.get('id');

  if (!id) {
    return of(null);
  }

  return pokemonService.getPokemonDetails(+id).pipe(
    map(details => {
      if (details) {
        return pokemonService.mapToPokemonData(details);
      }
      return null;
    }),
    catchError(error => {
      console.error('Erro ao buscar detalhes do Pokémon no resolver:', error);
      return of(null); // Retorna nulo em caso de erro para a página poder tratar
    })
  );
};

