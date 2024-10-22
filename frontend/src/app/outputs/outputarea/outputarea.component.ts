import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';
import { filter } from 'rxjs';
import { Store } from '@ngrx/store';
import Chart from 'chart.js/auto';

import { herosSelectors } from '@app/heroes/heros.reducer';
import { TabTitles } from '@app/tabview/tabview.component';
import { ITab, tabviewSelectors } from '@app/tabview/tabview.reducer';

type RV = [val: number, prob: number][]
type SINGLE_RV_DATA = {
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
type MULTI_RV_DATA = {[id: string]: SINGLE_RV_DATA}
type TAB_DATA = {
  text_response: string,
  multi_rv_data: MULTI_RV_DATA,
  chart: Chart|undefined,
}

@Component({
  selector: 'app-outputarea',
  templateUrl: './outputarea.component.html',
  styleUrl: './outputarea.component.scss'
})
export class OutputareaComponent implements AfterViewInit {
  readonly TabTitles = TabTitles;
  readonly TabsWithOutput: string[] = [TabTitles.DICE_CODE, TabTitles.PYTHON, TabTitles.GUISHOW];

  @Input() guiXML: string = '';

  allTabs: ITab[] = [];  // from store
  selectedTab: ITab|null = null;  // from store

  allResults: {[tabTitle: string]: TAB_DATA} = {};

  private rv_uuid = 0;

  constructor(
    private cd: ChangeDetectorRef, 
    private store: Store, 
  ) { }

  ngAfterViewInit(): void {
    this.store.select(tabviewSelectors.selectOpenTabs).subscribe(tabs => {
      this.allTabs = tabs;
      this.cd.detectChanges();
    });
    this.store.select(tabviewSelectors.selectSelectedTab).subscribe((tab) => {
      this.selectedTab = tab
      this.cd.detectChanges();
    });
    this.store.select(herosSelectors.selectOutputResponse).subscribe((response) => {
      const obj = response || {};
      const title: string|undefined = obj.title || this.selectedTab?.title;
      if (!title) {  // no tab selected
        console.error('Response with no tab selected!');
        return;
      }
      this.allResults[title] = this.getRespObj(title, obj.text, obj.rvs);
      this.cd.detectChanges();
    });
  }


  private getRespObj(title: string, response?: string, rvs?: any) {
    const result = {
      text_response: response || '',
      multi_rv_data: {},
      chart: undefined,
    } as TAB_DATA;
    if (!!rvs) {
      rvs?.forEach(([rv, name]: ([RV, string])) => {
        const uuid = `uuid_${++this.rv_uuid}`;
        result.multi_rv_data![uuid] = this.getCalcedRV(rv, true);
        result.multi_rv_data![uuid].named = name;
      });
      result.chart = this.getMeanChart('chart' + title, result.multi_rv_data!);
    }
    return result;
  }

  private getMeanChart(canvasTitle: string, rvs: MULTI_RV_DATA) {
    const chart = new Chart(canvasTitle, {
      type: 'bar',
      data: {
        labels: Object.entries(rvs).map(([id, {named}]) => named || id),
        datasets: [
          {
            label: 'mean',
            data: Object.values(rvs).map(({mean}) => mean),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
    return chart;
  }

  private getCalcedRV(pdf: RV, prob_is_100: boolean = true): SINGLE_RV_DATA {
    if (prob_is_100) {
      pdf = pdf.map(([val, prob]) => [val, prob * 100] as [number, number]);
    }
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
    return { pdf, atleast, atmost, mean, variance, std_dev, min_x, max_x, min_y, max_y };
  }

}
