import { AfterViewInit, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { DISPLAY_TYPE, MULTI_RV_DATA } from '../outputarea.component';

@Component({
  selector: 'app-outputchart',
  templateUrl: './outputchart.component.html',
  styleUrl: './outputchart.component.scss'
})
export class OutputchartComponent {

  @ViewChild('chart', {static: false}) chart: any;
  chartData: Chart|undefined;

  showCanvas = false;

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

  private setCanvasVisibility(visible: boolean) {
    console.log('setting canvas visibility', visible);
    this.showCanvas = visible;
    this.cd.detectChanges();
  }

  private initGraph(multiRvData?: MULTI_RV_DATA, displayType?: string) {
    if (this.chartData) {
      this.chartData.destroy();
      this.chartData = undefined;
    }
    if (!multiRvData || !displayType) {
      this.setCanvasVisibility(false);
      return
    }
    this.setCanvasVisibility(true);
    console.log('creating chart for', multiRvData, displayType);
    switch (displayType) {
      case DISPLAY_TYPE.TEXT:
        this.setCanvasVisibility(false);
        break;
      case DISPLAY_TYPE.MEANS:
        this.chartData = this.getMeanChart(multiRvData);
        break;
      default:
        console.error('Unknown display type', displayType);
        break;
    }
  }


  private getMeanChart(rvs: MULTI_RV_DATA) {
    return new Chart(this.chart.nativeElement, {
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
  }

}
