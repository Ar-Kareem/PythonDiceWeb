import { AfterViewInit, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { tabviewActions } from './tabview/tabview.reducer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit{


  constructor(private store: Store) {}

  ngAfterViewInit(): void {
    this.store.dispatch(tabviewActions.changeOpenTabs({openTabs: [{title: 'DiceCode', closable: false}]}));  // initial tab
    this.store.dispatch(tabviewActions.changeActiveIndex({newIndex: 0}));  // initial tab

  }

}
