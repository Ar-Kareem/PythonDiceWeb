import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';
import { herosSelectors } from '@app/heroes/heros.reducer';
import { TabTitles } from '@app/tabview/tabview.component';
import { ITab, tabviewSelectors } from '@app/tabview/tabview.reducer';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';

type RV = [val: number, prob: number][]
type RVDATA = {
  named?: string,
  pdf: RV,
  atleast: RV,
  atmost: RV,
  mean: number,
  variance: number,
  std_dev: number,
  min_x: number,
  max_x: number,
  min_y: number,
  max_y: number,
}
type RVS = {[id: string]: RVDATA}

@Component({
  selector: 'app-outputarea',
  templateUrl: './outputarea.component.html',
  styleUrl: './outputarea.component.scss'
})
export class OutputareaComponent implements AfterViewInit {
  readonly TabTitles = TabTitles;
  readonly TabsWithOutput: string[] = [TabTitles.DICE_CODE, TabTitles.PYTHON, TabTitles.GUISHOW];

  @Input() guiXML: string = '';

  ngContentsOutput: {[key: string]: string} = {};  // form store
  rvs: {[key: string]: RVS} = {};  // from store
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
    this.store.select(herosSelectors.selectOutputResponse).pipe(
      filter(response => !!response)
    ).subscribe((response) => {
      this.setResponse(response.text, response.rvs, response.title);
      this.cd.detectChanges();
    });
  }


  setResponse(response: string, rvs: any, title?: string) {
    title = title || this.selectedTab?.title;
    if (!title) {  // no tab selected
      console.error('No tab selected!!!');
      return;
    }
    this.ngContentsOutput[title] = response;
    this.rvs[title] = {};
    if (!!rvs) {
      rvs?.forEach(([rv, name]: ([RV, string])) => {
        console.log('setting up rv', name, title);
        
        this.setupRV(title, rv, name);
      });
    }
    console.log('rvs', this.rvs);
  }

  private rv_id = 0;
  setupRV(tabTitle: string, rv: RV, named?: string) {
    const id = `id_${this.rv_id++}`;
    const pdf = rv
    const atleast = pdf.map(([val, prob]) => [val, 0] as [number, number]);
    const atmost = pdf.map(([val, prob]) => [val, 0] as [number, number]);
    let sum = 0;
    for (let i = 0; i < pdf.length; i++) {
      sum += pdf[i][1];
      atleast[i][1] = sum;
    }
    sum = 0;
    for (let i = pdf.length-1; i >= 0; i--) {
      sum += pdf[i][1];
      atmost[i][1] = sum;
    }
    const mean = pdf.reduce((acc, [val, prob]) => acc + val * prob, 0);
    const variance = pdf.reduce((acc, [val, prob]) => acc + (val - mean) ** 2 * prob, 0);
    const std_dev = Math.sqrt(variance);
    const min_x = pdf[0][0];
    const max_x = pdf[pdf.length-1][0];
    const min_y = Math.min(...pdf.map(([_, prob]) => prob));
    const max_y = Math.max(...pdf.map(([_, prob]) => prob));
    this.rvs[tabTitle][id] = { named, pdf, atleast, atmost, mean, variance, std_dev, min_x, max_x, min_y, max_y };
  }

}
