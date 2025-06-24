import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { PokemonData } from '../../core/models/pokemon.model';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { PokemonDetailsModalComponent } from '../../shared/components/pokemon-details-modal/pokemon-details-modal.component'; // Reutilizando o visual

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-details.page.html',
  styleUrls: ['./pokemon-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    PokemonDetailsModalComponent // Reutilizando o componente visual
  ],
})
export class PokemonDetailPage implements OnInit {
  public pokemon$: Observable<PokemonData | null> = of(null);

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.pokemon$ = this.route.data.pipe(
      map((data: Data) => data['pokemon'] as PokemonData | null)
    );
  }
}

