import { Routes } from '@angular/router';
import { pokemonResolver } from './core/resolvers/pokemon.resolver';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'pokemon/:id',
    loadComponent: () => import('./pages/pokemon-details/pokemon-details.page').then(m => m.PokemonDetailPage),
    resolve: {
      pokemon: pokemonResolver // Aqui usamos o resolver!
    }
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];

