import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { filter, Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { herosSelectors } from '@app/heroes/heros.reducer';
import { TabTitles } from '@app/tabview/tabview.component';
import { ITab, tabviewSelectors } from '@app/tabview/tabview.reducer';

type RV = [val: number, prob: number][]
export type SINGLE_RV_DATA = {
  named: string,
  order: number,
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
export type MULTI_RV_DATA = {
  id_order: string[],
  rvs: {[id: string]: SINGLE_RV_DATA},
  transposed: Map<number, {name: string, prob: number}[]>,
}
export enum DISPLAY_TYPE {
  PDF = "Normal",
  ATLEAST = "At least",
  ATMOST = "At most",
  MEANS = "Summary",
  TRANSPOSE = "Transpose",
  TEXT = "Text",
}

type TAB_DATA = {
  display_type?: DISPLAY_TYPE,
  multi_rv_data?: MULTI_RV_DATA,
  text_response?: string,
}

@Component({
  selector: 'app-outputarea',
  templateUrl: './outputarea.component.html',
  styleUrl: './outputarea.component.scss'
})
export class OutputareaComponent implements AfterViewInit {
  readonly DISPLAY_TYPE = DISPLAY_TYPE;
  readonly TabTitles = TabTitles;
  readonly TabsWithOutput: string[] = [TabTitles.DICE_CODE, TabTitles.PYTHON, TabTitles.GUISHOW];

  @Input() guiXML: string = '';
  @Output() onCalculate = new EventEmitter();

  allTabs: ITab[] = [];  // from store
  selectedTab: ITab|null = null;  // from store
  workerStatus$: Observable<string> = this.store.select(herosSelectors.selectWorkerStatus).pipe(filter(status => typeof status === 'string'));  // from store
  
  allResults: {[tabTitle: string]: TAB_DATA|undefined} = {};  // the results for every tab
  currentDropdownItems: DISPLAY_TYPE[] = [];  // the items in the dropdown for the current tab ; updated by "updateDropdownItems"
  ddNgModel: string|undefined;

  constructor(
    private cd: ChangeDetectorRef, 
    private store: Store, 
  ) { }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      (window as any).outputs = this
    }
    this.store.select(tabviewSelectors.selectOpenTabs).subscribe(tabs => {
      this.allTabs = tabs;
      this.cd.detectChanges();
    });
    this.store.select(tabviewSelectors.selectSelectedTab).subscribe((tab) => {
      this.selectedTab = tab
      this.updateDropdownItems();
      this.cd.detectChanges();
    });
    this.store.select(herosSelectors.selectOutputResponse).subscribe((response) => {
      const title: string|undefined = response?.title || this.selectedTab?.title;
      if (!title) {  // no tab selected
        console.assert(false, 'Response with no tab selected. (problem unless on store init)');
        return;
      }
      this.allResults[title] = getRespObj(response?.text, response?.rvs, this.allResults[title]?.display_type);
      this.updateDropdownItems();
      this.cd.detectChanges();
    });
  }

  updateDropdownItems() {
    const tabTitle = this.selectedTab?.title;
    this.ddNgModel = undefined;
    if (!tabTitle) {
      this.currentDropdownItems = [];
      return;
    }
    if (!this.allResults[tabTitle]) {
      this.currentDropdownItems = [];
      return;
    }
    if (!this.allResults[tabTitle].multi_rv_data) {
      this.currentDropdownItems = [];
      return;
    }
    // init dropdown
    this.currentDropdownItems = Object.values(DISPLAY_TYPE);
    const init_display = this.allResults[tabTitle].display_type || DISPLAY_TYPE.MEANS;
    this.ddNgModel = init_display;
    this.dropdownChange(init_display);
  }

  dropdownChange(selected_type: DISPLAY_TYPE) {
    const tabTitle = this.selectedTab?.title;
    if (!tabTitle || !this.allResults[tabTitle]) {
      console.assert(false, 'DD changed when no tab selected!');
      return
    }
    this.allResults[tabTitle].display_type = selected_type as DISPLAY_TYPE;
  }
}

let __rv_uuid = 0;
function getRespObj(response_text?: string, response_rvs?: any, prev_display_type?: DISPLAY_TYPE): TAB_DATA {
  const result = {
    display_type: prev_display_type,
    text_response: response_text,
    multi_rv_data: undefined,
  } as TAB_DATA;
  if (!!response_rvs) {
    result.multi_rv_data = {id_order: [], rvs: {}, transposed: new Map()};
    response_rvs?.forEach(([rv, name]: ([RV, string]), i: number) => {
      const uuid = `uuid_${++__rv_uuid}`;
      result.multi_rv_data!.id_order.push(uuid);
      const order = i;
      const named = !!name ? name : `Output ${i+1}`;
      result.multi_rv_data!.rvs[uuid] = getCalcedRV(rv, order, named, true);
    });
    result.multi_rv_data!.transposed = getTranspose(result.multi_rv_data!.rvs, result.multi_rv_data!.id_order);
  }
  return result;
}

function getTranspose(rvs: {[id: string]: SINGLE_RV_DATA}, order: string[]) {
  const allVals = Object.values(rvs).map(rv => rv.pdf.map(([val, prob]) => val));
  const uniqueVals = Array.from(new Set(allVals.flat())).sort((a, b) => a - b);
  // val -> [(name, prob), ...]
  const valNameProb: {[val: number]: {n: string, p?: number}[]} = {}
  uniqueVals.forEach(val => {
    valNameProb[val] = order.map(id => ({n: rvs[id].named}));
  })
  order.forEach((id, i) => {
    rvs[id].pdf.forEach(([val, prob]) => {
      valNameProb[val][i].p = prob;
    });
  });
  const result: Map<number, {name: string, prob: number}[]> = new Map();
  uniqueVals.forEach(val => {
    result.set(val, valNameProb[val]
      .filter(({p}) => p !== undefined)
      .map(({n, p}) => ({name:n, prob:p!}))
    );
  });
  return result;
}

function getCalcedRV(pdf: RV, order: number, named: string, prob_is_100: boolean = true): SINGLE_RV_DATA {
  // calculate (mean, variance, std_dev) before normalizing
  const mean = pdf.reduce((acc, [val, prob]) => acc + val * prob, 0);
  const variance = pdf.reduce((acc, [val, prob]) => acc + (val - mean) ** 2 * prob, 0);
  const std_dev = Math.sqrt(variance);
  if (prob_is_100) {
    pdf = pdf.map(([val, prob]) => [val, prob * 100] as [number, number]);
  }
  const atmost = pdf.map(([val, prob]) => [val, 0] as [number, number]);
  const atleast = pdf.map(([val, prob]) => [val, 0] as [number, number]);
  let sum = 0;
  for (let i = 0; i < pdf.length; i++) {
    sum += pdf[i][1];
    atmost[i][1] = sum;
  }
  sum = 0;
  for (let i = pdf.length-1; i >= 0; i--) {
    sum += pdf[i][1];
    atleast[i][1] = sum;
  }
  const min_x = pdf[0][0];
  const max_x = pdf[pdf.length-1][0];
  const min_y = Math.min(...pdf.map(([_, prob]) => prob));
  const max_y = Math.max(...pdf.map(([_, prob]) => prob));
  return { order, named, pdf, atleast, atmost, mean, variance, std_dev, min_x, max_x, min_y, max_y };
}
