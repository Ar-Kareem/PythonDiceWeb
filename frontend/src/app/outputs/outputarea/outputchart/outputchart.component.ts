import { ChangeDetectorRef, Component, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { BarWithErrorBarsController, BarWithErrorBar } from 'chartjs-chart-error-bars';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';

import { DISPLAY_TYPE, MULTI_RV_DATA } from '../outputarea.component';

// register controller in chart.js and ensure the defaults are set
Chart.register(BarWithErrorBarsController, BarWithErrorBar);
Chart.register(BoxPlotController, BoxAndWiskers);


const CHART_HEIGHT_PX = {
  base: 50,  // start with this
  per_row: 20,  // add for each row
  for_title: 124,  // extra if title
}

@Component({
  selector: 'app-outputchart',
  templateUrl: './outputchart.component.html',
  styleUrl: './outputchart.component.scss'
})
export class OutputchartComponent {

  @ViewChildren('chart') chartsRef: QueryList<ElementRef> = new QueryList();
  chartsData: (Chart|null)[] = [];
  displayedText: string|undefined;

  _multiRvData: MULTI_RV_DATA|undefined;  // INPUT
  _displayType: DISPLAY_TYPE|undefined;  // INPUT

  @Input()
  set multiRvData(data: MULTI_RV_DATA|undefined) {
    if (this._multiRvData === data) {
      return;
    }
    this._multiRvData = data;
    this.initGraph(data, this._displayType);
  }
  @Input()
  set displayType(type: DISPLAY_TYPE|undefined) {
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

  private initGraph(multiRvData?: MULTI_RV_DATA, displayType?: DISPLAY_TYPE) {
    this.displayedText = undefined;
    if (this.chartsData.length > 0) {  // destroy old charts
      this.chartsData.forEach(chart => !!chart && chart.destroy());
      this.chartsData = [];
    }
    if (!multiRvData || displayType == undefined) {
      return
    }
    // console.log('creating chart for', multiRvData, displayType);
    switch (displayType) {

      case DISPLAY_TYPE.MEANS:
        this.setupMeanChart(multiRvData);
        break;
      case DISPLAY_TYPE.BAR_NORMAL:
      case DISPLAY_TYPE.BAR_ATLEAST:
      case DISPLAY_TYPE.BAR_ATMOST:
        this.setupPdfChart(multiRvData, displayType);
        break;
      case DISPLAY_TYPE.BAR_TRANSPOSE:
        this.setupTranspose(multiRvData.transposed);
        break;
      case DISPLAY_TYPE.GRAPH_NORMAL:
      case DISPLAY_TYPE.GRAPH_ATLEAST:
      case DISPLAY_TYPE.GRAPH_ATMOST:
        this.setupGraph(multiRvData, displayType);
        break;
      case DISPLAY_TYPE.GRAPH_TRANSPOSE:
        this.setupGraphTranspose(multiRvData);
        break;
      case DISPLAY_TYPE.GRAPH_MEANS:
        this.setupGraphMeans(multiRvData);
        break;
      // do nothing for the following
      case DISPLAY_TYPE.TEXT:
      case DISPLAY_TYPE.ROLLER:
      case DISPLAY_TYPE.EXPORT_NORMAL:
      case DISPLAY_TYPE.EXPORT_ATLEAST:
      case DISPLAY_TYPE.EXPORT_ATMOST:
      case DISPLAY_TYPE.EXPORT_TRANSPOSE:
      case DISPLAY_TYPE.EXPORT_MEANS:
        break;
      default:
        console.error('Unknown display type', displayType);
        break;
    }
  }

  private setupMeanChart(multiRvData: MULTI_RV_DATA) {
    this.setCanvasCount(2);
    if (this.chartsRef.length !== 2) throw new Error('Expected exactly 2 chart canvas');

    const rvs = Object.values(multiRvData.rvs);
    const min_x = Math.min(...rvs.map(({min_x}) => min_x)) - 1;
    const max_x = Math.max(...rvs.map(({max_x}) => max_x)) + 1;

    const {labelsFormatted, valuesFormatted} = setupLabelsAndData(rvs.map(({named, mean}) => [named, mean]), '');
    const whiskers = rvs.map(({std_dev}) => +std_dev.toFixed(2))
    const chartObj = getHorizBarWithErrorBars(labelsFormatted, valuesFormatted, whiskers, 'Mean Roll');
    this.chartsData[0] = new Chart(this.chartsRef.first.nativeElement, chartObj);
    const h = CHART_HEIGHT_PX.base + (CHART_HEIGHT_PX.per_row) * labelsFormatted.length + CHART_HEIGHT_PX.for_title;
    this.chartsRef.first.nativeElement.parentNode.style.height = `${h}px`;

    // boxplot
    const boxData = rvs.map(({min_x, q1_x, median_x, mean, q3_x, max_x}) => ({whiskerMax: min_x, min: min_x, q1: q1_x, mean, median: median_x, q3: q3_x, whiskerMin: max_x, max: max_x}));
    const boxLabels = rvs.map(({named}) => named);
    // console.log('boxplot', boxLabels, boxData, min_x, max_x);
    const boxChartObj = getHorizBoxPlot(boxLabels, boxData, 'Box Plot', min_x, max_x);
    this.chartsData[1] = new Chart(this.chartsRef.last.nativeElement, boxChartObj);
    const h2 = CHART_HEIGHT_PX.base + (CHART_HEIGHT_PX.per_row) * boxLabels.length + CHART_HEIGHT_PX.for_title;
    this.chartsRef.last.nativeElement.parentNode.style.height = `${h2}px`;
}

  private setupPdfChart(multiRvData: MULTI_RV_DATA, type: DISPLAY_TYPE) {
    const N = multiRvData.id_order.length;
    this.setCanvasCount(N);
    if (this.chartsRef.length !== N) throw new Error('Expected exactly one chart canvas per RV');
    this.chartsRef.forEach((chart, i) => {
      const rv = multiRvData.rvs[multiRvData.id_order[i]];
      const pdf = type === DISPLAY_TYPE.BAR_ATLEAST ? rv.atleast : (type === DISPLAY_TYPE.BAR_ATMOST ? rv.atmost : rv.pdf);
      const {labelsFormatted, valuesFormatted} = setupLabelsAndData(pdf, '%');
      const title = rv.named + ` (${rv.mean.toFixed(2)} ± ${rv.std_dev.toFixed(2)})`;
      const chartObj = getHorizBarChart(labelsFormatted, valuesFormatted, title, 100);
      this.chartsData[i] = new Chart(chart.nativeElement, chartObj);
      const h = CHART_HEIGHT_PX.base + CHART_HEIGHT_PX.per_row * labelsFormatted.length;
      chart.nativeElement.parentNode.style.height = `${h}px`;
    });
  }

  private setupTranspose(transposed: Map<number, {name: string, prob: number}[]>) {
    const N = transposed.size;
    this.setCanvasCount(N);
    if (this.chartsRef.length !== N) throw new Error('Expected exactly one chart canvas per unique value');
    let i = 0;
    transposed.forEach((valNameProb, val) => {
      const {labelsFormatted, valuesFormatted} = setupLabelsAndData(valNameProb.map(({name, prob}) => [name, prob]), '%');
      const chartObj = getHorizBarChart(labelsFormatted, valuesFormatted, `${val}`, 100);
      const chart = this.chartsRef.get(i);
      this.chartsData[i] = new Chart(chart!.nativeElement, chartObj);
      const h = CHART_HEIGHT_PX.base + CHART_HEIGHT_PX.per_row * labelsFormatted.length;
      chart!.nativeElement.parentNode.style.height = `${h}px`;
      i += 1;
    });
  }

  private setupGraph(multiRvData: MULTI_RV_DATA, displayType: DISPLAY_TYPE) {
    const uniqueVals = Array.from(multiRvData.transposed.keys());
    if (uniqueVals.length < 2) {
      this.displayedText = 'Need at least 2 Unique values to display graph';
      return;
    }
    this.setCanvasCount(1);
    if (this.chartsRef.length !== 1) throw new Error('Expected exactly one chart canvas');

    const x_labels = uniqueVals.map(v => v.toString());
    const datasets = multiRvData.id_order.map(rv_id => {
      const rv = multiRvData.rvs[rv_id];
      const pdf = displayType === DISPLAY_TYPE.GRAPH_NORMAL ? rv.pdf : (displayType === DISPLAY_TYPE.GRAPH_ATLEAST ? rv.atleast : rv.atmost);
      const data = uniqueVals.map(v => rv.pdfMap.has(v) ? pdf[rv.pdfMap.get(v)!.index][1] : NaN);
      return {label: rv.named, data};
    });
    this.chartsData[0] = new Chart(this.chartsRef.first.nativeElement, getLineChart(x_labels, datasets, 'Graph'));
    const h = getGraphHeight();
    this.chartsRef.first.nativeElement.parentNode.style.height = `${h}px`;
  }

  private setupGraphTranspose(multiRvData: MULTI_RV_DATA) {
    if (multiRvData.id_order.length < 2) {
      this.displayedText = 'Need at least 2 Outputs to display transpose graph';
      return;
    }
    this.setCanvasCount(1);
    if (this.chartsRef.length !== 1) throw new Error('Expected exactly one chart canvas');

    const x_labels = multiRvData.id_order.map(rv_id => multiRvData.rvs[rv_id].named);
    const datasets: {label: string, data: number[]}[] = [];
    multiRvData.transposed_unfiltered.forEach((valNameProb, val) => {
      const data = valNameProb.map(({name, prob}, i) => typeof prob === 'number' ? prob : NaN);  // NaN if the RV doesn't have this value (this is how transpose works)
      datasets.push({label: val.toString(), data});
    });
    this.chartsData[0] = new Chart(this.chartsRef.first.nativeElement, getLineChart(x_labels, datasets, 'Graph'));
    const h = getGraphHeight();
    this.chartsRef.first.nativeElement.parentNode.style.height = `${h}px`;
  }

  private setupGraphMeans(multiRvData: MULTI_RV_DATA) {
    if (multiRvData.id_order.length < 2) {
      this.displayedText = 'Need at least 2 Outputs to display summary graph';
      return;
    }
    this.setCanvasCount(1);
    if (this.chartsRef.length !== 1) throw new Error('Expected exactly one chart canvas');

    const x_labels = multiRvData.id_order.map(rv_id => multiRvData.rvs[rv_id].named);
    const datasets: {label: string, data: number[]}[] = [
      {label: 'mean', data: multiRvData.id_order.map(id => multiRvData.rvs[id].mean)},
      {label: 'deviation', data: multiRvData.id_order.map(id => multiRvData.rvs[id].std_dev)},
      {label: 'maximum', data: multiRvData.id_order.map(id => multiRvData.rvs[id].max_x)},
      {label: 'minimum', data: multiRvData.id_order.map(id => multiRvData.rvs[id].min_x)},
    ]

    this.chartsData[0] = new Chart(this.chartsRef.first.nativeElement, getLineChart(x_labels, datasets, 'Graph'));
    const h = getGraphHeight();
    this.chartsRef.first.nativeElement.parentNode.style.height = `${h}px`;
  }

}

function getGraphHeight() {
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  if (screenWidth < 600) {  // prevent tall lanky graphs on small screens
    return screenWidth;
  }
  if (screenHeight < 600) {  // prevent too tall graphs on landscape
    return screenHeight
  }
  return 600;
}

function getLineChart(x_labels: string[], datasets: {label: string, data: number[]}[], title: string): any {
  return {
    type: 'line',
    data: {
      labels: x_labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...plugin_settings(title),
        legend: {
          position: 'right',
        },
      },
      scales: {
        y: {
          ticks: {
            ...tick_style.ticks,
            callback: function(value: any, index: any, ticks: any) {
                return value + '%';  // Include a percent sign in the ticks
            },
          },
        },
        x: tick_style,
      },
    },
  };
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
      responsive: true,
      maintainAspectRatio: false,
      plugins: plugin_settings(title),
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
      responsive: true,
      maintainAspectRatio: false,
      plugins: plugin_settings(title),
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

function getHorizBoxPlot(labels: string[], data: {min: number, whiskerMax: number, q1: number, median: number, mean: number, q3: number, max: number, whiskerMin: number}[], title: string, minval: number, maxval: number): any {
  data = data.map((d) => ({min: d.min, whiskerMin: d.whiskerMax, q1: d.q1, median: d.median, mean: d.mean, q3: d.q3, whiskerMax: d.whiskerMin, max: d.max}))  // for some reason this is needed otherwise tooltip does not work
  return {
    type: 'boxplot',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: plugin_settings(title),
      indexAxis: 'y',
      scales: {
        y: tick_style,
        x: {
          ...tick_style,
          min: minval,
          max: maxval,
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

function setupLabelsAndData(lv: [number|string, number][], suffix: string = '') {
  const numOfSpaces = Math.max(...lv.map(([l, v]) => v.toFixed(2).length)) + 1;
  const labelsFormatted = lv.map(([l, v]) => `${l} ${v.toFixed(2).padStart(numOfSpaces, ' ')}${suffix}`)
  const valuesFormatted = lv.map(([l, v]) => +v.toFixed(2))
  return {labelsFormatted, valuesFormatted};
}
