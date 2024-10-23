import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { herosSelectors } from '@app/heroes/heros.reducer';

@Component({
  selector: 'app-gui-prod',
  templateUrl: './gui-prod.component.html',
  styleUrl: './gui-prod.component.scss'
})
export class GuiProdComponent {

  compiledGUI = this.store.select(herosSelectors.selectGUITree);

  constructor(private store: Store) {}

}
