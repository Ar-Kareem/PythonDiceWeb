import { Component, Input } from '@angular/core';
import { DISPLAY_TYPE, MULTI_RV_DATA } from '../outputarea.component';

@Component({
  selector: 'app-exporter',
  templateUrl: './exporter.component.html',
  styleUrl: './exporter.component.scss'
})
export class ExporterComponent {

  _multiRvData: MULTI_RV_DATA|undefined;  // INPUT
  _displayType: DISPLAY_TYPE|undefined;  // INPUT
  displayedText: string = '';

  @Input()
  set multiRvData(data: MULTI_RV_DATA|undefined) {
    if (this._multiRvData === data) {
      return;
    }
    this.displayedText = ''
    this._multiRvData = data;
    this.initExporter(data, this._displayType);
  }
  @Input()
  set displayType(type: DISPLAY_TYPE|undefined) {
    if (this._displayType === type) {
      return;
    }
    this.displayedText = ''
    this._displayType = type;
    this.initExporter(this._multiRvData, type);
  }

  constructor() {}

  initExporter(data: MULTI_RV_DATA|undefined, type: DISPLAY_TYPE|undefined) {
    if (!data || !type) {
      return;
    }
    switch (type) {
      default:
        return
      case DISPLAY_TYPE.EXPORT_NORMAL:
      case DISPLAY_TYPE.EXPORT_ATLEAST:
      case DISPLAY_TYPE.EXPORT_ATMOST:
        this.setupExportRegular(data, type)
        return
      case DISPLAY_TYPE.EXPORT_TRANSPOSE:
        this.setupExportMap(data.transposed, '%')
        return
      case DISPLAY_TYPE.EXPORT_MEANS:
        this.setupExportMeans(data)
        return
    }
    // console.log('initExporter', data, type);
  }

  setupExportRegular(data: MULTI_RV_DATA, type: DISPLAY_TYPE) {
    this.displayedText = ''
    data.id_order.forEach(id => {
      const rv = data.rvs[id]
      const dist = type === DISPLAY_TYPE.EXPORT_NORMAL ? rv.pdf : type === DISPLAY_TYPE.EXPORT_ATLEAST ? rv.atleast : type === DISPLAY_TYPE.EXPORT_ATMOST ? rv.atmost : null
      if (!dist) {
        throw new Error(`Invalid display type for export ${type}`)
      }
      this.displayedText += `"${rv.named}",${parse(rv.mean)},${parse(rv.std_dev)},${rv.min_x},${rv.max_x}\n`
      this.displayedText += `#,%\n`
      dist.forEach(([val, prob]) => {
        this.displayedText += `${val},${parse(prob)}\n`
      })
      this.displayedText += '\n'
    })
  }

  setupExportMap(map: Map<string|number, {name: string, prob: number}[]>, suffix: string) {
    this.displayedText = ''
    map.forEach((name_prob, value) => {
      this.displayedText += `"${value}"\n`
      this.displayedText += `"output",${suffix}\n`
      name_prob.forEach(({name, prob}) => {
        this.displayedText += `"${name}",${parse(prob)}\n`
      })
      this.displayedText += '\n'
    })
  }

  setupExportMeans(data: MULTI_RV_DATA) {
    const map = new Map<string, {name: string, prob: number}[]>()
    const mean = data.id_order.map(id => {
      const rv = data.rvs[id]
      return {name: rv.named, prob: rv.mean}
    })
    const deviation = data.id_order.map(id => {
      const rv = data.rvs[id]
      return {name: rv.named, prob: rv.std_dev}
    })
    const maximum = data.id_order.map(id => {
      const rv = data.rvs[id]
      return {name: rv.named, prob: rv.max_x}
    })
    const minimum = data.id_order.map(id => {
      const rv = data.rvs[id]
      return {name: rv.named, prob: rv.min_x}
    })
    map.set('mean', mean)
    map.set('deviation', deviation)
    map.set('maximum', maximum)
    map.set('minimum', minimum)
    this.setupExportMap(map, '#')
  }
}

function parse(n: number|string): number|string {
  if (typeof n === 'string') {
    return n
  }
  return +n.toFixed(10)
}