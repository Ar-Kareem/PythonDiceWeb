import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { filter, Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { herosSelectors } from '@app/heroes/heros.reducer';
import { TabTitles } from '@app/tabview/tabview.component';
import { ITab, tabviewSelectors } from '@app/tabview/tabview.reducer';
import { WorkerStatus } from '@app/localbackend/local.service';
import { ToastActions } from '@app/toast/toast.reducer';

type RV = [val: number, prob: number][]
export type SINGLE_RV_DATA = {
  named: string,
  order: number,
  pdf: RV,
  pdfMap: Map<number, {index: number, prob: number}>,
  atleast: RV,
  atmost: RV,
  mean: number,
  variance: number,
  std_dev: number,
  min_x: number,
  max_x: number,
  min_y: number,
  max_y: number,
  q1_x: number,
  median_x: number,
  q3_x: number,
}
export type MULTI_RV_DATA = {
  id_order: string[],
  rvs: {[id: string]: SINGLE_RV_DATA},
  transposed: Map<number, {name: string, prob: number}[]>,
  transposed_unfiltered: Map<number, {name: string, prob?: number}[]>,
}
export enum DISPLAY_TYPE {
  MEANS,
  TEXT,
  ROLLER,

  BAR_NORMAL,
  BAR_ATLEAST,
  BAR_ATMOST,
  BAR_TRANSPOSE,

  GRAPH_NORMAL,
  GRAPH_ATLEAST,
  GRAPH_ATMOST,
  GRAPH_TRANSPOSE,
  GRAPH_MEANS,

  EXPORT_NORMAL,
  EXPORT_ATLEAST,
  EXPORT_ATMOST,
  EXPORT_TRANSPOSE,
  EXPORT_MEANS,
}

type TAB_DATA = {
  display_type?: DISPLAY_TYPE,
  multi_rv_data?: MULTI_RV_DATA,
  text_response?: string,
  err_msg?: string,
}

@Component({
  selector: 'app-outputarea',
  templateUrl: './outputarea.component.html',
  styleUrl: './outputarea.component.scss'
})
export class OutputareaComponent implements AfterViewInit {
  readonly DISPLAY_TYPE = DISPLAY_TYPE;
  readonly TabTitles = TabTitles;
  readonly WorkerStatus = WorkerStatus;
  readonly TabsWithOutput: string[] = [TabTitles.DICE_CODE, TabTitles.PYTHON, TabTitles.GUISHOW];

  @Input() guiXML: string = '';
  @Output() onCalculate = new EventEmitter();

  allTabs: ITab[] = [];  // from store
  selectedTab: ITab|null = null;  // from store
  workerStatus$: Observable<string> = this.store.select(herosSelectors.selectWorkerStatus).pipe(filter(status => typeof status === 'string'));  // from store
  
  allResults: {[tabTitle: string]: TAB_DATA|undefined} = {};  // the results for every tab
  ddItemsFirst: DD1ENUM[] = [];  // first dd strings
  ddItemsSecond: DD2ENUM[] = [];  // second dd strings
  ddNgModelFirst: DD1ENUM|undefined;
  ddNgModelSecond: DD2ENUM|undefined;

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
    this.store.select(herosSelectors.selectOutputResponse).pipe(
      filter(response => response !== null)
    ).subscribe((response) => {
      const title: string|undefined = response?.title || this.selectedTab?.title;
      if (!title) {  // no tab selected
        console.assert(false, 'Response with no tab selected. Should never happen.');
        return;
      }
      this.allResults[title] = getRespObj(response?.text, response?.rvs, this.allResults[title]?.display_type);
      if (!!this.allResults[title].err_msg) {
        this.store.dispatch(ToastActions.errorNotification({ title: 'Output Error', message: this.allResults[title].err_msg }));
      }
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
    err_msg: undefined,
  } as TAB_DATA;
  if (!!response_rvs) {
    result.multi_rv_data = {id_order: [], rvs: {}, transposed: new Map(), transposed_unfiltered: new Map()};
    let i: number = 0;
    response_rvs?.forEach(([rv, name]: ([RV, string])) => {
      const uuid = `uuid_${++__rv_uuid}`;
      if (isOutput0(rv) && name?.startsWith('DISPLAY ')) {  // special case for settings display type | output 0 named "DISPLAY A B"
        const {i1, i2} = parse_dd(name);
        try {
          result.display_type = selectedToDisplayType(i1 as DD1ENUM, i2 as DD2ENUM);
        } catch (error) {
          console.assert(false, 'Invalid DISPLAY type', i1, i2);
          result.err_msg = `Invalid DISPLAY type: ${i1} ${i2}`;
        }
        return;
      }
      result.multi_rv_data!.id_order.push(uuid);
      const order = i;
      const named = !!name ? name : `Output ${i+1}`;
      result.multi_rv_data!.rvs[uuid] = getCalcedRV(rv, order, named, true);
      i++;
    });
    const {filtered, unfiltered} = getTranspose(result.multi_rv_data!.rvs, result.multi_rv_data!.id_order);
    result.multi_rv_data!.transposed = filtered;
    result.multi_rv_data!.transposed_unfiltered = unfiltered;
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
  const unfiltered: Map<number, {name: string, prob?: number}[]> = new Map();
  const filtered: Map<number, {name: string, prob: number}[]> = new Map();
  uniqueVals.forEach(val => {
    unfiltered.set(val, valNameProb[val]
      .map(({n, p}) => ({name:n, prob:p}))
    );
    filtered.set(val, valNameProb[val]
      .filter(({p}) => p !== undefined)  // ignores RVs that dont have this val
      .map(({n, p}) => ({name:n, prob:p!}))
    );
  });
  return {filtered, unfiltered};
}

function getCalcedRV(pdf: RV, order: number, named: string, prob_is_100: boolean = true): SINGLE_RV_DATA {
  // calculate (mean, variance, std_dev) before normalizing
  const mean = pdf.reduce((acc, [val, prob]) => acc + val * prob, 0);
  const variance = pdf.reduce((acc, [val, prob]) => acc + (val - mean) ** 2 * prob, 0);
  const std_dev = Math.sqrt(variance);
  if (prob_is_100) {
    pdf = pdf.map(([val, prob]) => [val, prob * 100] as [number, number]);
  }
  const pdfMap = new Map<number, {index: number, prob: number}>();
  pdf.forEach(([val, prob], i) => pdfMap.set(val, {index: i, prob}));

  const atmost = pdf.map(([val, prob]) => [val, 0] as [number, number]);
  const atleast = pdf.map(([val, prob]) => [val, 0] as [number, number]);
  let sum = 0;
  for (let i = 0; i < pdf.length; i++) {
    sum += pdf[i][1];
    atmost[i][1] = sum;
  }
  // next is "atleast" which is the cdf. calculate more useful stats
  sum = 0;
  let q1_x = null;  // 25th percentile
  let median_x = null;
  let q3_x = null;  // 75th percentile
  for (let i = pdf.length-1; i >= 0; i--) {
    sum += pdf[i][1];
    atleast[i][1] = sum;
    if (q1_x == null && atleast[i][1] >= .25*(prob_is_100?100:1)) {
      q1_x = pdf[i][0];
    }
    if (median_x == null && atleast[i][1] >= .50*(prob_is_100?100:1)) {
      median_x = pdf[i][0];
    }
    if (q3_x == null && atleast[i][1] >= .75*(prob_is_100?100:1)) {
      q3_x = pdf[i][0];
    }
  }
  const min_x = pdf[0][0];
  const max_x = pdf[pdf.length-1][0];
  const min_y = Math.min(...pdf.map(([_, prob]) => prob));
  const max_y = Math.max(...pdf.map(([_, prob]) => prob));
  return { order, named, pdf, pdfMap, atleast, atmost, mean, variance, std_dev, min_x, max_x, min_y, max_y, q1_x: q1_x as number, median_x: median_x as number, q3_x: q3_x as number };
}

enum DD1ENUM {
  BAR = 'Bar',
  GRAPH = 'Graph',
  SUMMARY = 'Summary',
  TEXT = 'Text',
  ROLLER = 'Roller',
  EXPORT = 'Export',
}
enum DD2ENUM {
  NORMAL = 'Normal',
  ATLEAST = 'At least',
  ATMOST = 'At most',
  TRANSPOSE = 'Transpose',
  SUMMARY = 'Summary',
  NULL = '',
}
function displayTypeToDropdown(init_display?: DISPLAY_TYPE): { i1: DD1ENUM; i2: DD2ENUM; } {
  // DISPLAY_TYPE => text on screen
  switch (init_display) {
    // BARS
    case undefined:  // default option
    case DISPLAY_TYPE.BAR_NORMAL:
      return { i1: DD1ENUM.BAR, i2: DD2ENUM.NORMAL };
    case DISPLAY_TYPE.BAR_ATLEAST:
      return { i1: DD1ENUM.BAR, i2: DD2ENUM.ATLEAST };
    case DISPLAY_TYPE.BAR_ATMOST:
      return { i1: DD1ENUM.BAR, i2: DD2ENUM.ATMOST };
    case DISPLAY_TYPE.BAR_TRANSPOSE:
      return { i1: DD1ENUM.BAR, i2: DD2ENUM.TRANSPOSE };

    // GRAPHS
    case DISPLAY_TYPE.GRAPH_NORMAL:
      return { i1: DD1ENUM.GRAPH, i2: DD2ENUM.NORMAL };
    case DISPLAY_TYPE.GRAPH_ATLEAST:
      return { i1: DD1ENUM.GRAPH, i2: DD2ENUM.ATLEAST };
    case DISPLAY_TYPE.GRAPH_ATMOST:
      return { i1: DD1ENUM.GRAPH, i2: DD2ENUM.ATMOST };
    case DISPLAY_TYPE.GRAPH_TRANSPOSE:
      return { i1: DD1ENUM.GRAPH, i2: DD2ENUM.TRANSPOSE };
    case DISPLAY_TYPE.GRAPH_MEANS:
      return { i1: DD1ENUM.GRAPH, i2: DD2ENUM.SUMMARY };

    // OTHER
    case DISPLAY_TYPE.MEANS:
      return { i1: DD1ENUM.SUMMARY, i2: DD2ENUM.NULL };
    case DISPLAY_TYPE.TEXT:
      return { i1: DD1ENUM.TEXT, i2: DD2ENUM.NULL };
    case DISPLAY_TYPE.ROLLER:
      return { i1: DD1ENUM.ROLLER, i2: DD2ENUM.NULL };

    // EXPORT
    case DISPLAY_TYPE.EXPORT_NORMAL:
      return { i1: DD1ENUM.EXPORT, i2: DD2ENUM.NORMAL };
    case DISPLAY_TYPE.EXPORT_ATLEAST:
      return { i1: DD1ENUM.EXPORT, i2: DD2ENUM.ATLEAST };
    case DISPLAY_TYPE.EXPORT_ATMOST:
      return { i1: DD1ENUM.EXPORT, i2: DD2ENUM.ATMOST };
    case DISPLAY_TYPE.EXPORT_TRANSPOSE:
      return { i1: DD1ENUM.EXPORT, i2: DD2ENUM.TRANSPOSE };
    case DISPLAY_TYPE.EXPORT_MEANS:
      return { i1: DD1ENUM.EXPORT, i2: DD2ENUM.SUMMARY };
  }
}
function selectedToDisplayType(i1?: DD1ENUM, i2?: DD2ENUM): DISPLAY_TYPE {
  // text on screen => DISPLAY_TYPE
  if (i1 === DD1ENUM.BAR) {
    switch (i2) {
      case undefined:
      case DD2ENUM.NULL:
      case DD2ENUM.SUMMARY:
      case DD2ENUM.NORMAL:
        return DISPLAY_TYPE.BAR_NORMAL;
      case DD2ENUM.ATLEAST:
        return DISPLAY_TYPE.BAR_ATLEAST;
      case DD2ENUM.ATMOST:
        return DISPLAY_TYPE.BAR_ATMOST;
      case DD2ENUM.TRANSPOSE:
        return DISPLAY_TYPE.BAR_TRANSPOSE;
    }
  } else if (i1 === DD1ENUM.GRAPH) {
    switch (i2) {
      case undefined:
      case DD2ENUM.NULL:
      case DD2ENUM.NORMAL:
        return DISPLAY_TYPE.GRAPH_NORMAL
      case DD2ENUM.ATLEAST:
        return DISPLAY_TYPE.GRAPH_ATLEAST
      case DD2ENUM.ATMOST:
        return DISPLAY_TYPE.GRAPH_ATMOST
      case DD2ENUM.TRANSPOSE:
        return DISPLAY_TYPE.GRAPH_TRANSPOSE
      case DD2ENUM.SUMMARY:
        return DISPLAY_TYPE.GRAPH_MEANS
    }
  } else if (i1 === DD1ENUM.SUMMARY) {
    return DISPLAY_TYPE.MEANS;
  } else if (i1 === DD1ENUM.TEXT) {
    return DISPLAY_TYPE.TEXT;
  } else if (i1 === DD1ENUM.ROLLER) {
    return DISPLAY_TYPE.ROLLER;
  } else if (i1 === DD1ENUM.EXPORT) {
    switch (i2) {
      case undefined:
      case DD2ENUM.NULL:
      case DD2ENUM.NORMAL:
        return DISPLAY_TYPE.EXPORT_NORMAL;
      case DD2ENUM.ATLEAST:
        return DISPLAY_TYPE.EXPORT_ATLEAST;
      case DD2ENUM.ATMOST:
        return DISPLAY_TYPE.EXPORT_ATMOST;
      case DD2ENUM.TRANSPOSE:
        return DISPLAY_TYPE.EXPORT_TRANSPOSE;
      case DD2ENUM.SUMMARY:
        return DISPLAY_TYPE.EXPORT_MEANS;
    }
  } else if (i1 === undefined) {
    return DISPLAY_TYPE.BAR_NORMAL;
  }
  throw new Error(`Invalid dropdown selection: ${i1} ${i2}`);
}
function dropdownItemsToDisplay(i1: DD1ENUM, i2: DD2ENUM): { i1s: DD1ENUM[]; i2s: DD2ENUM[]; } {
  // text on screen => all possible dropdown items
  const i1s = [
    DD1ENUM.BAR, 
    DD1ENUM.SUMMARY, 
    DD1ENUM.GRAPH,
    // DD1ENUM.TEXT, 
    DD1ENUM.ROLLER, 
    DD1ENUM.EXPORT
  ];
  switch (i1) {
    case DD1ENUM.BAR:
      return {i1s: i1s, i2s: [DD2ENUM.NORMAL, DD2ENUM.ATLEAST, DD2ENUM.ATMOST, DD2ENUM.TRANSPOSE] }
    case DD1ENUM.GRAPH:
      return {i1s: i1s, i2s: [DD2ENUM.NORMAL, DD2ENUM.ATLEAST, DD2ENUM.ATMOST, DD2ENUM.TRANSPOSE, DD2ENUM.SUMMARY] }
    case DD1ENUM.EXPORT:
      return {i1s: i1s, i2s: [DD2ENUM.NORMAL, DD2ENUM.ATLEAST, DD2ENUM.ATMOST, DD2ENUM.TRANSPOSE, DD2ENUM.SUMMARY] }
    case DD1ENUM.SUMMARY:
    case DD1ENUM.TEXT:
    case DD1ENUM.ROLLER:
      return {i1s: i1s, i2s: [] }
  }
}

function isOutput0(rv: RV) {
  return rv.length === 1 && rv[0][0] === 0 && rv[0][1] === 1;
}
function parse_dd(name: string) {
  const combined = name.substring('DISPLAY '.length)
  const i = combined.indexOf(' ');
  let i1, i2;
  if (i >= 0) {
    [i1, i2] = [combined.slice(0,i), combined.slice(i+1)];
  } else {
    i1 = combined;
  }
  return {i1, i2};
}