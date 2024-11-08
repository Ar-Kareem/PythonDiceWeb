import { AfterViewInit, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { LocationStrategy } from '@angular/common'; 
import { herosSelectors, SidebarActions } from '../heros.reducer';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.scss'
})
export class DocsComponent implements AfterViewInit {

  visible = false
  baseHref: string = this.locationStrategy.getBaseHref();
  activeIndex = [0];

  constructor(
    private store: Store,
    private locationStrategy: LocationStrategy,
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
