import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';
import { herosSelectors } from '@app/heroes/heros.reducer';
import { TabTitles } from '@app/tabview/tabview.component';
import { ITab, tabviewSelectors } from '@app/tabview/tabview.reducer';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-outputarea',
  templateUrl: './outputarea.component.html',
  styleUrl: './outputarea.component.scss'
})
export class OutputareaComponent implements AfterViewInit {
  readonly TabTitles = TabTitles;
  readonly TabsWithOutput: string[] = [TabTitles.DICE_CODE, TabTitles.PYTHON, TabTitles.GUISHOW];

  @Input() guiXML: string = '';

  ngContentsOutput = new Map<string, string>();  // form store
  allTabs: ITab[] = [];  // from store
  selectedTabIndex: number|undefined;  // from store
  selectedTab: ITab|null = null;  // from store

  constructor(
    private cd: ChangeDetectorRef, 
    private store: Store, 
  ) { }

  ngAfterViewInit(): void {
    this.store.select(tabviewSelectors.selectOpenTabs).subscribe(tabs => {
      this.allTabs = tabs;
      this.cd.detectChanges();
    });

    this.store.select(tabviewSelectors.selectActiveIndex).subscribe(index => {
      this.selectedTabIndex = index;
      this.cd.detectChanges();
    });
    this.store.select(tabviewSelectors.selectSelectedTab).subscribe((tab) => {
      this.selectedTab = tab
      this.cd.detectChanges();
    });
    this.store.select(herosSelectors.selectOutputResponse).subscribe((response) => {
      this.setResponse(response.text, response.title);
      this.cd.detectChanges();
    });
  }


  setResponse(response: string, title?: string) {
    title = title || this.selectedTab?.title;
    if (!title) {  // no tab selected
      console.error('No tab selected!!!');
      return;
    }
    this.ngContentsOutput.set(title, response);
  }

}
