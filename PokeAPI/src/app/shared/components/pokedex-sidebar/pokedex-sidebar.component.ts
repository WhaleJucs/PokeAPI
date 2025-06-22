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
  @Output() select = new EventEmitter<number>();

  @ViewChildren('sidebarItem', { read: ElementRef }) sidebarItems!: QueryList<ElementRef>;

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
}