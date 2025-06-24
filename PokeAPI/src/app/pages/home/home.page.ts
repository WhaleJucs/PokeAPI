import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonSpinner, IonLabel, IonToggle, IonModal, Platform } from '@ionic/angular/standalone';
import { Subject, Observable, BehaviorSubject, of, distinctUntilChanged, filter } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { PokemonService } from '../../core/services/pokemon.service';
import { FavoriteService } from '../../core/services/favorite.service'; // Import the new service
import { PokemonCardComponent } from '../../shared/components/pokemon-card/pokemon-card.component';
import { PokemonDetailsModalComponent } from '../../shared/components/pokemon-details-modal/pokemon-details-modal.component';
import { PokedexSidebarComponent } from '../../shared/components/pokedex-sidebar/pokedex-sidebar.component';
import { PokemonData, PokemonDetails } from '../../core/models/pokemon.model';

const DESKTOP_BREAKPOINT = 768;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonSpinner, FormsModule, CommonModule, PokemonCardComponent,
    PokedexSidebarComponent, IonLabel, IonToggle, IonModal, PokemonDetailsModalComponent,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private pokemonSource = new BehaviorSubject<PokemonData[]>([]);
  public filteredPokemons$: Observable<PokemonData[]> = this.pokemonSource.asObservable();

  public isLoadingPage: boolean = true;
  public isCardLoading: boolean = false;
  public searchTerm: string = '';
  public currentIndex: number = 0; 
  public selectedPokemon: PokemonData | null = null;
  public showOnlyFavorites = false;
  public isDarkMode: boolean = false;
  public isSidebarModalOpen = false;
  public isDesktop = false;

  private pokemonsOnPage: PokemonData[] = [];
  public totalPokemons = 1025;
  public currentPage = 0;
  public pageSize = 150;
  public get totalPages() { return Math.ceil(this.totalPokemons / this.pageSize); }
  private allPokemonNames: { name: string; id: number; }[] = [];

  public favorites: { name: string; id: number; }[] = []; // Will be subscribed to
  public favoritePokemonsDetails: PokemonData[] = []; // Will be subscribed to

  constructor(
    private pokemonService: PokemonService,
    private platform: Platform,
    private favoriteService: FavoriteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeTheme();
    this.favoriteService.favorites$.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(favs => this.favorites = favs); 
    this.favoriteService.favoritePokemonsDetails$.pipe(distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(favDetails => this.favoritePokemonsDetails = favDetails);
  }

  ngOnInit() {
    this.loadAllPokemonNames();
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const oldCurrentPage = this.currentPage;
      const oldSearchTerm = this.searchTerm;
      const oldShowOnlyFavorites = this.showOnlyFavorites;

      this.currentPage = +params['page'] || 0;
      this.searchTerm = params['search'] || '';
      this.showOnlyFavorites = params['favorites'] === 'true';
      const goToLast = params['goToLast'] === 'true'; 

      const pageChanged = this.currentPage !== oldCurrentPage;
      const filtersChanged = this.searchTerm !== oldSearchTerm || this.showOnlyFavorites !== oldShowOnlyFavorites;
      const isInitialLoad = this.pokemonsOnPage.length === 0; 

      if (isInitialLoad || pageChanged) { 
        this.loadPageData(this.currentPage, goToLast); 
      } else if (filtersChanged) { 
        this.applyFiltersAndLoadPage(goToLast);
      }
    });
    this.checkPlatform();
    this.platform.resize.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.checkPlatform());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- LÓGICA DE CARREGAMENTO E NAVEGAÇÃO ---

  public loadPage(page: number, goToLast: boolean = false) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page, goToLast: goToLast ? true : null },
      queryParamsHandling: 'merge',
    });
  }

  private loadPageData(page: number, goToLast: boolean) { 
    this.isLoadingPage = true;
    this.currentPage = page;
    const apiOffset = page * this.pageSize;

    this.pokemonService.getPokemons(apiOffset, this.pageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const placeholderPokemons: PokemonData[] = response.results.map(p => {
          const id = Number(p.url.split('/')[6]);
          return { id, name: p.name, notLoaded: true };
        });
        
        this.pokemonsOnPage = placeholderPokemons;
        this.pokemonSource.next(placeholderPokemons);

        // Defina o índice correto aqui
        let targetIndex = goToLast ? placeholderPokemons.length - 1 : 0;
        this.currentIndex = targetIndex;

        this.isLoadingPage = false;

        // Carregue os detalhes do card correto
        if (placeholderPokemons.length > 0) {
          this.loadCardDetails(this.currentIndex);
        } else {
          this.isCardLoading = false;
          this.pokemonSource.next([]);
        }
      },
      error: (err) => {
        console.error("Erro ao carregar a lista de Pokémons:", err);
        this.isLoadingPage = false;
      }
    });
  }

  loadCardDetails(index: number) {
    const pokemons = this.pokemonSource.getValue();
    const targetPokemon = pokemons[index];

    if (!targetPokemon || !targetPokemon.notLoaded) {
      this.isCardLoading = false;
      return;
    }

    this.isCardLoading = true;
    this.pokemonService.getPokemonDetails(targetPokemon.id).pipe(takeUntil(this.destroy$)).subscribe(details => {
      if (details) {
        const detailedPokemon = this.pokemonService.mapToPokemonData(details);
        detailedPokemon.favorite = this.favorites.some(fav => fav.id === detailedPokemon.id);

        const updatedPokemons = [...pokemons];
        updatedPokemons[index] = detailedPokemon;
        this.pokemonSource.next(updatedPokemons);
      }
      this.isCardLoading = false;
    });
  }

  public prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadCardDetails(this.currentIndex);
    } else if (this.currentPage > 0) {
      this.loadPage(this.currentPage - 1, true); // goToLast = true ao voltar página
    } else {
      this.currentIndex = 0;
    }
  }

  public nextCard() {
    const pokemons = this.pokemonSource.getValue();
    if (this.currentIndex < pokemons.length - 1) {
      this.currentIndex++;
      this.loadCardDetails(this.currentIndex);
    } else if (this.currentPage < this.totalPages - 1) {
      this.loadPage(this.currentPage + 1, false); // goToLast = false ao avançar página
    } else {
      this.currentIndex = pokemons.length - 1;
    }
  }

  public selectCard(index: number) {
    this.currentIndex = index;
    this.loadCardDetails(this.currentIndex);
  }

  // --- FUNÇÕES CORRIGIDAS ---

  public toggleTheme(): void {
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  public toggleFavorite(pokemon: PokemonData): void {
    this.favoriteService.toggleFavorite(pokemon);

    this.applyFiltersAndLoadPage(false); 
  }

  public onSearchInput(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.searchTerm || null, page: 0, goToLast: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private applyFiltersAndLoadPage(goToLast: boolean): void { 
    const currentSelectedPokemonId = this.pokemonSource.getValue()[this.currentIndex]?.id;
    let newPokemonList: PokemonData[] = [];

    // Se o filtro de favoritos estiver ativo, ele tem prioridade.
    if (this.showOnlyFavorites) {
      newPokemonList = this.favoritePokemonsDetails;
      this.pokemonSource.next(newPokemonList);
      this.isLoadingPage = false;
    }
    // Se a busca estiver vazia, restaura a lista da página atual.
    else if (!this.searchTerm) {
      if (this.pokemonsOnPage.length > 0 && 
          this.pokemonsOnPage[0].id === (this.currentPage * this.pageSize + 1)) {
        newPokemonList = this.pokemonsOnPage;
        this.pokemonSource.next(newPokemonList);

        // Defina o índice correto aqui
        let targetIndex = goToLast ? newPokemonList.length - 1 : 0;
        this.currentIndex = targetIndex;

        if (newPokemonList.length > 0) {
          this.loadCardDetails(this.currentIndex);
        } else {
          this.isCardLoading = false;
          this.pokemonSource.next([]);
        }
      } else { 
        this.loadPageData(this.currentPage, goToLast); 
        return;
      }
    }
    // Se há um termo de busca, filtra a lista MESTRA de todos os nomes.
    else {
      const term = this.searchTerm.toLowerCase();
      const filteredNames = this.allPokemonNames.filter(
        (poke) => poke.name.toLowerCase().includes(term) || poke.id.toString().startsWith(term)
      );
      newPokemonList = filteredNames.map((pokeRef) => ({ id: pokeRef.id, name: pokeRef.name, notLoaded: true }));
      this.pokemonSource.next(newPokemonList);
      this.isLoadingPage = false;

      // Defina o índice correto aqui
      let targetIndex = 0;
      this.currentIndex = targetIndex;

      if (newPokemonList.length > 0) {
        this.loadCardDetails(this.currentIndex);
      } else {
        this.isCardLoading = false;
        this.pokemonSource.next([]);
      }
    }
  }
  
  // --- Funções de Suporte ---

  public loadAllPokemonNames(): void {
    this.pokemonService.getPokemons(0, this.totalPokemons).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.allPokemonNames = response.results.map((poke) => {
          const match = poke.url.match(/\/pokemon\/(\d+)\//);
          const id = match ? Number(match[1]) : 0;
          return { name: poke.name, id };
        }).filter((poke) => poke.id && poke.id <= this.totalPokemons);
      },
      error: (err) => {
        console.error("Erro ao carregar a lista de nomes de Pokémons:", err);
      },
    });
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
      this.isDarkMode = true;
      document.body.classList.add('dark');
    }
  }

  private checkPlatform() {
    this.isDesktop = this.platform.width() > DESKTOP_BREAKPOINT;
  }

  public setOpenSidebar(isOpen: boolean) {
    this.isSidebarModalOpen = isOpen;
  }

  public get isCurrentPokemonFavorite(): boolean {
    const pokemons = this.pokemonSource.getValue();
    const currentPokemon = pokemons[this.currentIndex];
    if (!currentPokemon) return false; 
    return this.favoriteService.isPokemonFavorite(currentPokemon.id);
  }

  public toggleFavoriteFilter(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { favorites: this.showOnlyFavorites ? true : null, page: 0, search: null, goToLast: null }, 
      queryParamsHandling: 'merge',
    });
  }

  public goToDetails(pokemon: PokemonData): void {
    this.selectedPokemon = pokemon;
  }

  public closeDetails(): void {
    this.selectedPokemon = null;
  }
}