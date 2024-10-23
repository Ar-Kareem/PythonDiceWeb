import { ChangeDetectorRef, Component, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { BarWithErrorBarsController, BarWithErrorBar } from 'chartjs-chart-error-bars';

import { DISPLAY_TYPE, MULTI_RV_DATA } from '../outputarea.component';

// register controller in chart.js and ensure the defaults are set
Chart.register(BarWithErrorBarsController, BarWithErrorBar);

const CHART_HEIGHT_PX = {
  base: 64,  // start with this
  per_row: 22,  // add for each row
  for_title: 64,  // extra if title
}

@Component({
  selector: 'app-outputchart',
  templateUrl: './outputchart.component.html',
  styleUrl: './outputchart.component.scss'
})
export class OutputchartComponent {

  @ViewChildren('chart') chartsRef: QueryList<ElementRef> = new QueryList();
  chartsData: (Chart|null)[] = [];

  _multiRvData: MULTI_RV_DATA|undefined;  // INPUT
  _displayType: string|undefined;  // INPUT

  @Input()
  set multiRvData(data: MULTI_RV_DATA|undefined) {
    if (this._multiRvData === data) {
      return;
    }
    this._multiRvData = data;
    this.initGraph(data, this._displayType);
  }
  @Input()
  set displayType(type: string|undefined) {
    if (this._displayType === type) {
      return;
    }
    this._displayType = type;
    this.initGraph(this._multiRvData, type);
  }

  constructor(
    private cd: ChangeDetectorRef
  ) { }


  alwaysTrue() {
    return true;
  }

  private setCanvasCount(count: number) {
    this.chartsData = Array(count).fill(null);  // fill with null to create canvar refs
    if (this.chartsData.length > 0) {
      this.cd.detectChanges();  // to make refs available
    }
  }

  private initGraph(multiRvData?: MULTI_RV_DATA, displayType?: string) {
    if (this.chartsData.length > 0) {  // destroy old charts
      this.chartsData.forEach(chart => !!chart && chart.destroy());
      this.chartsData = [];
    }
    if (!multiRvData || !displayType) {
      return
    }
    // console.log('creating chart for', multiRvData, displayType);
    switch (displayType) {
      case DISPLAY_TYPE.TEXT:
        break;
      case DISPLAY_TYPE.MEANS:
        this.setupMeanChart(multiRvData);
        break;
      case DISPLAY_TYPE.PDF:
      case DISPLAY_TYPE.ATLEAST:
      case DISPLAY_TYPE.ATMOST:
        this.setupPdfChart(multiRvData, displayType);
        break;
      case DISPLAY_TYPE.TRANSPOSE:
        this.setupTranspose(multiRvData);
        break;
      default:
        console.error('Unknown display type', displayType);
        break;
    }
  }

  private setupMeanChart(multiRvData: MULTI_RV_DATA) {
    this.setCanvasCount(1);
    if (this.chartsRef.length !== 1) throw new Error('Expected exactly one chart canvas');
    const rvs = Object.values(multiRvData.rvs);
    const {labelsFormatted, valuesFormatted} = setupLabelsAndData(rvs.map(({named}) => named), rvs.map(({mean}) => mean));
    const whiskers = rvs.map(({std_dev}) => +std_dev.toFixed(2))
    const meanChartData = getHorizBarWithErrorBars(labelsFormatted, valuesFormatted, whiskers, 'Mean Roll');
    this.chartsData[0] = new Chart(this.chartsRef.first.nativeElement, meanChartData)
    const h = CHART_HEIGHT_PX.base + (CHART_HEIGHT_PX.per_row + 10) * labelsFormatted.length + CHART_HEIGHT_PX.for_title;
    this.chartsRef.first.nativeElement.parentNode.style.height = `${h}px`;
}

  private setupPdfChart(multiRvData: MULTI_RV_DATA, type: DISPLAY_TYPE) {
    const N = multiRvData.id_order.length;
    this.setCanvasCount(N);
    if (this.chartsRef.length !== N) throw new Error('Expected exactly one chart canvas per RV');
    this.chartsRef.forEach((chart, i) => {
      const rv = multiRvData.rvs[multiRvData.id_order[i]];
      const pdf = type === DISPLAY_TYPE.ATLEAST ? rv.atleast : (type === DISPLAY_TYPE.ATMOST ? rv.atmost : rv.pdf);
      const {labelsFormatted, valuesFormatted} = setupLabelsAndData(pdf.map(([val, _]) => `${val}`), pdf.map(([_, prob]) => prob), '%');
      const title = rv.named + ` (${rv.mean.toFixed(2)} ± ${rv.std_dev.toFixed(2)})`;
      const pdfChart = getHorizBarChart(labelsFormatted, valuesFormatted, title, 100);
      this.chartsData[i] = new Chart(chart.nativeElement, pdfChart);
      const h = CHART_HEIGHT_PX.base + CHART_HEIGHT_PX.per_row * labelsFormatted.length;
      chart.nativeElement.parentNode.style.height = `${h}px`;
    });
  }

  private setupTranspose(multiRvData: MULTI_RV_DATA) {
    const allVals = Object.values(multiRvData.rvs).map(rv => rv.pdf.map(([val, prob]) => val));
    const uniqueVals = Array.from(new Set(allVals.flat())).sort((a, b) => a - b);
    // val -> [(name, prob), ...]
    const valNameProb: {[val: number]: {n: string, p?: number}[]} = {}
    uniqueVals.forEach(val => {
      valNameProb[val] = multiRvData.id_order.map(id => ({n: multiRvData.rvs[id].named}));
    })
    multiRvData.id_order.forEach((id, i) => {
      multiRvData.rvs[id].pdf.forEach(([val, prob]) => {
        valNameProb[val][i].p = prob;
      });
    });
    const N = uniqueVals.length;
    this.setCanvasCount(N);
    if (this.chartsRef.length !== N) throw new Error('Expected exactly one chart canvas per unique value');
    this.chartsRef.forEach((chart, i) => {
      const val = uniqueVals[i];
      const rows = valNameProb[val].filter(obj => obj.p !== undefined);
      const {labelsFormatted, valuesFormatted} = setupLabelsAndData(rows.map(obj => obj.n), rows.map(obj => obj.p!), '%');
      const pdfChart = getHorizBarChart(labelsFormatted, valuesFormatted, `${val}`, 100);
      this.chartsData[i] = new Chart(chart.nativeElement, pdfChart);
      const h = CHART_HEIGHT_PX.base + CHART_HEIGHT_PX.per_row * labelsFormatted.length;
      chart.nativeElement.parentNode.style.height = `${h}px`;
    });
  }
}



function getHorizBarChart(labels: string[], data: number[], title: string, maxprob?: number): any {
  return {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: plugin_settings(title),
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        y: tick_style,
        x: {
          display: false,
          min: 0,
          max: maxprob,
        },
      },
    },
  };
}

function getHorizBarWithErrorBars(labels: string[], data: number[], whiskers: number[], title: string, maxprob?: number): any {
  return {
    type: 'barWithErrorBars',
    data: {
      labels: labels,
      datasets: [
        {
          // label: title,
          data: data.map((v, i) => ({
            x: v,
            xMin: +(v - whiskers[i]).toFixed(2),
            xMax: +(v + whiskers[i]).toFixed(2),
          })),
          errorBarLineWidth: 2,
          errorBarWhiskerLineWidth: 2,
          errorBarWhiskerRatio: 0.35,
          errorBarColor: '#ddd',
          errorBarWhiskerColor: '#ddd',
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: plugin_settings(title),
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        y: tick_style,
        x: {
          ...tick_style,
          min: 0,
          max: maxprob,
        },
      },
    },
  };
}

const tick_style = {
  ticks: {
    font: {
      family: '"Courier New", Courier, monospace',
      size: 14,
    },
    color: '#fff',
  },
};
const plugin_settings = (title: string) => ({
  title: {
    display: true,
    text: title,
    align: 'top',
    color: '#ddd',
    font: {
      size: 16,
      weight: 'bolder',
      family: '"Courier New", Courier, monospace',
    }
  },
  legend: {
    display: false,
  },
});

function setupLabelsAndData(labels: string[], values: number[], suffix: string = '') {
  const numOfSpaces = Math.max(...values.map(p => p.toFixed(2).length)) + 1;
  const labelsFormatted = values.map((_, i) => `${labels[i]} ${values[i].toFixed(2).padStart(numOfSpaces, ' ')}${suffix}`)
  const valuesFormatted = values.map(p => +p.toFixed(2))
  return {labelsFormatted, valuesFormatted};
}
