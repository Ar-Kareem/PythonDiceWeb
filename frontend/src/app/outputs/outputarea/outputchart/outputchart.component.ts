import { ChangeDetectorRef, Component, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { BarWithErrorBarsController, BarWithErrorBar } from 'chartjs-chart-error-bars';

import { DISPLAY_TYPE, MULTI_RV_DATA } from '../outputarea.component';

// register controller in chart.js and ensure the defaults are set
Chart.register(BarWithErrorBarsController, BarWithErrorBar);

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
      default:
        console.error('Unknown display type', displayType);
        break;
    }
  }


  private setupMeanChart(multiRvData: MULTI_RV_DATA) {
    this.setCanvasCount(1);
    if (this.chartsRef.length !== 1) throw new Error('Expected exactly one chart canvas');
    const rvs = multiRvData.rvs;
    const labels = Object.values(rvs).map(({named, mean}) => `${named} ${mean.toFixed(2).padStart(5, ' ')}`)
    const data = Object.values(rvs).map(({mean}) => +mean.toFixed(2))
    const whiskers = Object.values(rvs).map(({std_dev}) => +std_dev.toFixed(2))
    const meanChartData = this.getHorizBarWithErrorBars(labels, data, whiskers, 'means');
    this.chartsData[0] = new Chart(this.chartsRef.first.nativeElement, meanChartData)
    const h = 128 + 18 * labels.length;
    this.chartsRef.first.nativeElement.parentNode.style.height = `${h}px`;
}

  private setupPdfChart(multiRvData: MULTI_RV_DATA, type: DISPLAY_TYPE) {
    const N = multiRvData.id_order.length;
    this.setCanvasCount(N);
    if (this.chartsRef.length !== N) throw new Error('Expected exactly one chart canvas per RV');
    this.chartsRef.forEach((chart, i) => {
      const rv = multiRvData.rvs[multiRvData.id_order[i]];
      const pdf = type === DISPLAY_TYPE.ATLEAST ? rv.atleast : (type === DISPLAY_TYPE.ATMOST ? rv.atmost : rv.pdf);
      const labels = pdf.map(([val, prob]) => `${val} ${prob.toFixed(2).padStart(5, ' ')}%`);
      const data = pdf.map(([_, prob]) => prob);
      const title = rv.named + ` (${rv.mean.toFixed(2)} ± ${rv.std_dev.toFixed(2)})`;
      const pdfChart = this.getHorizBarChart(labels, data, title, 100);
      this.chartsData[i] = new Chart(chart.nativeElement, pdfChart);
      const h = 128 + 18 * labels.length;
      chart.nativeElement.parentNode.style.height = `${h}px`;
    });
  }

  private getHorizBarChart(labels: string[], data: number[], title: string, maxprob?: number): any {
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
        plugins: {
          title: {
            display: true,
            text: title,
            align: 'top',
            color: '#ddd',
            font: {
              size: 16,
              weight: 'bolder',
              family: 'monospace',
            }
          },
          legend: {
            display: false,
          }
        },
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          y: {
            ticks: {
              font: {
                family: 'Consolas',
                size: 14,
              },
              color: '#fff',
            },
          },
          x: {
            title: {
              text: 'Probability',
              display: true,
              color: '#fff',
              font: {
                family: 'Consolas',
                size: 16,
              },
            },
            ticks: {
              color: '#fff',
            },
            min: 0,
            max: maxprob,
          },
        },
      },
    };
  }

  private getHorizBarWithErrorBars(labels: string[], data: number[], whiskers: number[], title: string, maxprob?: number): any {
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
        plugins: {
          title: {
            display: true,
            text: title,
            align: 'top',
            color: '#ddd',
            font: {
              size: 16,
              weight: 'bolder',
              family: 'monospace',
            }
          },
          legend: {
            display: false,
          }
        },
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          y: {
            ticks: {
              font: {
                family: 'Consolas',
                size: 14,
              },
              color: '#fff',
            },
          },
          x: {
            title: {
              text: 'Mean Roll',
              display: true,
              color: '#fff',
              font: {
                family: 'Consolas',
                size: 16,
              },
            },
            ticks: {
              color: '#fff',
            },
            min: 0,
            max: maxprob,
          },
        },
      },
    };
  }
}
