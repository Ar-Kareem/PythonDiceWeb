import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { LocationStrategy } from '@angular/common'; 
import { herosSelectors, SidebarActions } from '../heros.reducer';
import Utils from '@app/utils';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.scss'
})
export class DocsComponent implements AfterViewInit {

  visible = false
  baseHref: string = this.locationStrategy.getBaseHref();
  activeIndex: number[] = [];

  constructor(
    private store: Store,
    private locationStrategy: LocationStrategy,
    private cd: ChangeDetectorRef,
  ) { }

  ngAfterViewInit() {
    this.store.select(herosSelectors.selectDocsVisible).subscribe(visible => {
      this.accordianBugFix()
      this.visible = visible
    });
    if (typeof window !== 'undefined') {
      (window as any).docs = this
    }
  }

  accordianBugFix() {
    // https://github.com/primefaces/primeng/issues/12174
    this.activeIndex = Utils.range(0, 100)
    this.cd.detectChanges()
    this.activeIndex = []
    this.cd.detectChanges()
  }

  onHide() {
    this.store.dispatch(SidebarActions.setDocsVisible({ visible: false }));
  }

}
