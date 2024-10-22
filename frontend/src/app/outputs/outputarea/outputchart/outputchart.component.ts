import { ChangeDetectorRef, Component, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DISPLAY_TYPE, MULTI_RV_DATA, SINGLE_RV_DATA } from '../outputarea.component';

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
        this.setupPdfChart(multiRvData);
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
    const labels = Object.entries(rvs).map(([id, {named}]) => named || id)
    const data = Object.values(rvs).map(({mean}) => mean)
    const meanChartData = this.getHorizBarChart(labels, data, 'mean');
    this.chartsData[0] = new Chart(this.chartsRef.first.nativeElement, meanChartData)
    const h = 128 + 18 * labels.length;
    this.chartsRef.first.nativeElement.parentNode.style.height = `${h}px`;
}

  private setupPdfChart(multiRvData: MULTI_RV_DATA) {
    const N = multiRvData.id_order.length;
    this.setCanvasCount(N);
    if (this.chartsRef.length !== N) throw new Error('Expected exactly one chart canvas per RV');
    this.chartsRef.forEach((chart, i) => {
      const rv = multiRvData.rvs[multiRvData.id_order[i]];
      const labels = rv.pdf.map(([val, _]) => val.toString());
      const data = rv.pdf.map(([_, prob]) => prob);
      const pdfChart = this.getHorizBarChart(labels, data, rv.named || 'output');
      this.chartsData[i] = new Chart(chart.nativeElement, pdfChart);
      const h = 128 + 18 * labels.length;
      chart.nativeElement.parentNode.style.height = `${h}px`;
    });
  }

  private getHorizBarChart(labels: string[], data: number[], title: string): any {
    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: title,
            data: data,
            borderWidth: 1,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            min: 0,
            max: 100,
          },
        },
      },
    };
  }

}
