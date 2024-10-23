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
  BAR_NORMAL = "Normal",
  BAR_ATLEAST = "At least",
  BAR_ATMOST = "At most",
  BAR_TRANSPOSE = "Transpose",
  MEANS = "Summary",
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
  ddItemsFirst: string[] = [];  // first dd strings
  ddItemsSecond: string[] = [];  // second dd strings
  ddNgModelFirst: string|undefined;
  ddNgModelSecond: string|undefined;

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
    this.ddNgModelFirst = undefined;
    this.ddNgModelSecond = undefined;
    if (!tabTitle || !this.allResults[tabTitle]?.multi_rv_data) {
      this.ddItemsFirst = [];
      this.ddItemsSecond = [];
      return;
    }
    // init dropdown
    const {i1, i2} = displayTypeToDropdown(this.allResults[tabTitle].display_type);
    this.ddNgModelFirst = i1;
    this.ddNgModelSecond = i2;
    this.dropdownNgChanged();
  }

  dropdownNgChanged() {
    const tabTitle = this.selectedTab?.title;
    if (!tabTitle || !this.allResults[tabTitle]) {
      console.assert(false, 'DD changed when no tab selected!');
      return
    }
    const chosen = selectedToDisplayType(this.ddNgModelFirst, this.ddNgModelSecond)
    this.allResults[tabTitle].display_type = chosen;
    const { i1, i2 } = displayTypeToDropdown(chosen);
    const { i1s, i2s } = dropdownItemsToDisplay(i1, i2);
    this.ddItemsFirst = i1s;
    this.ddItemsSecond = i2s;
    this.ddNgModelFirst = i1;
    this.ddNgModelSecond = i2;
    this.cd.detectChanges();
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

enum dd1 {
  BAR = 'Bar',
  SUMMARY = 'Summary',
  TEXT = 'Text',
}
enum dd2 {
  NORMAL = 'Normal',
  ATLEAST = 'At least',
  ATMOST = 'At most',
  TRANSPOSE = 'Transpose',
}
function displayTypeToDropdown(init_display?: DISPLAY_TYPE): { i1: string; i2: string; } {
  // DISPLAY_TYPE => text on screen
  switch (init_display) {
    default:
      return { i1: dd1.BAR, i2: dd2.NORMAL };
    case DISPLAY_TYPE.BAR_NORMAL:
      return { i1: dd1.BAR, i2: dd2.NORMAL };
    case DISPLAY_TYPE.BAR_ATLEAST:
      return { i1: dd1.BAR, i2: dd2.ATLEAST };
    case DISPLAY_TYPE.BAR_ATMOST:
      return { i1: dd1.BAR, i2: dd2.ATMOST };
    case DISPLAY_TYPE.BAR_TRANSPOSE:
      return { i1: dd1.BAR, i2: dd2.TRANSPOSE };
    case DISPLAY_TYPE.MEANS:
      return { i1: dd1.SUMMARY, i2: '' };
    case DISPLAY_TYPE.TEXT:
      return { i1: dd1.TEXT, i2: '' };
  }
}
function selectedToDisplayType(i1?: string, i2?: string): DISPLAY_TYPE {
  // text on screen => DISPLAY_TYPE
  if (i1 === dd1.BAR) {
    switch (i2) {
      case dd2.NORMAL:
        return DISPLAY_TYPE.BAR_NORMAL;
      case dd2.ATLEAST:
        return DISPLAY_TYPE.BAR_ATLEAST;
      case dd2.ATMOST:
        return DISPLAY_TYPE.BAR_ATMOST;
      case dd2.TRANSPOSE:
        return DISPLAY_TYPE.BAR_TRANSPOSE;
      default:  // no second dropdown => normal
        return DISPLAY_TYPE.BAR_NORMAL;
    }
  } else if (i1 === dd1.SUMMARY) {
    return DISPLAY_TYPE.MEANS;
  } else if (i1 === dd1.TEXT) {
    return DISPLAY_TYPE.TEXT;
  } else {  // no first dropdown => normal
    return DISPLAY_TYPE.BAR_NORMAL;
    
  }
}
function dropdownItemsToDisplay(i1: string, i2: string): { i1s: string[]; i2s: string[]; } {
  // text on screen => all possible dropdown items
  const i1s = [dd1.BAR, dd1.SUMMARY, dd1.TEXT];
  switch (i1) {
    case dd1.BAR:
      return {i1s: i1s, i2s: [dd2.NORMAL, dd2.ATLEAST, dd2.ATMOST, dd2.TRANSPOSE] }
    case dd1.SUMMARY:
    case dd1.TEXT:
        return {i1s: i1s, i2s: [] }
    default:
      throw new Error(`Unknown dropdown item ${i1}`);
  }
}
