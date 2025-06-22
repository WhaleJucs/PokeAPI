import { Component, Input, Output, EventEmitter, AfterViewInit, QueryList, ViewChildren, SimpleChanges, OnChanges, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pokedex-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokedex-sidebar.component.html',
  styleUrls: ['./pokedex-sidebar.component.scss'],
})
export class PokedexSidebarComponent implements AfterViewInit, OnChanges {
  @Input() pokemons: any[] = [];
  @Input() currentIndex: number = 0;
  @Input() isLoadingSidebar = false;
  @Output() select = new EventEmitter<number>();
  @Output() favoriteFilterToggled = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  @ViewChildren('sidebarItem', { read: ElementRef }) sidebarItems!: QueryList<ElementRef>;

  showOnlyFavorites = false;

  // Adicionando as novas propriedades de paginação
  @Input() currentPage = 0;
  @Input() totalPages = 1;
  @Input() pageSize = 150;
  @Input() totalPokemons = 1025;
  @Output() pageChange = new EventEmitter<number>();

  ngAfterViewInit() {
    this.scrollToSelected();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentIndex'] && !changes['currentIndex'].firstChange) {
      this.scrollToSelected();
    }
  }

  onSelect(index: number) {
    this.select.emit(index);
  }

  toggleFavoriteFilter() {
    this.favoriteFilterToggled.emit();
  }

  onSidebarScroll(event: Event) {
    const target = event.target as HTMLElement;
    // Quando chegar perto do fim, emite o evento
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 40) {
      this.loadMore.emit();
    }
  }

  private scrollToSelected() {
    setTimeout(() => {
      const items = this.sidebarItems?.toArray();
      if (items && items[this.currentIndex]) {
        items[this.currentIndex].nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    });
  }

  // Métodos para mudança de página
  previousPage() {
    if (this.currentPage > 0) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }
  nextPage() {
    if ((this.currentPage + 1) * this.pageSize < this.totalPokemons) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
}