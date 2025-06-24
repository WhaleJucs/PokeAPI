import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'pokemon-details/:name',
    loadComponent: () => import('./pages/pokemon-details/pokemon-details.page').then((m) => m.PokemonDetailsPage),
  },
];
