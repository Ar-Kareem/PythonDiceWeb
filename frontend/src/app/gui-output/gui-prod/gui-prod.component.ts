import { AfterViewInit, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { GUIElement } from '../GUIModels';
import { herosSelectors } from '../../heroes/heros.reducer';

@Component({
  selector: 'app-gui-prod',
  templateUrl: './gui-prod.component.html',
  styleUrl: './gui-prod.component.scss'
})
export class GuiProdComponent implements AfterViewInit {

  compiledGUI: GUIElement | null = null;

  constructor(private store: Store) {}

  ngAfterViewInit() {
    this.store.select(herosSelectors.selectGUITree).subscribe((state) => {
      console.log('GUI PROD INIT', state);
      this.compiledGUI = state;
    });
  }

}
