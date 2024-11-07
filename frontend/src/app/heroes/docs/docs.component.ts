import { AfterViewInit, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { herosSelectors, SidebarActions } from '../heros.reducer';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.scss'
})
export class DocsComponent implements AfterViewInit {

  visible = false

  constructor(
    private store: Store,
  ) { }

  ngAfterViewInit() {
    this.store.select(herosSelectors.selectDocsVisible).subscribe(visible => {
      console.log('DOCS VISIBLE', visible);
      this.visible = visible
    });
  }

  onHide() {
    this.store.dispatch(SidebarActions.setDocsVisible({ visible: false }));
  }

}
