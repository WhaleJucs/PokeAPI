import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    // Usa loadComponent para carregar a HomePage de forma "lazy" (sob demanda)
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    // Nova rota para a tela de detalhes do Pokémon
    // ':name' é um parâmetro que pegaremos na URL (será o nome do Pokémon)
    path: 'pokemon-details/:name',
    // Usa loadComponent para carregar a PokemonDetailsPage de forma "lazy"
    loadComponent: () => import('./pages/pokemon-details/pokemon-details.page').then((m) => m.PokemonDetailsPage),
  },
];
