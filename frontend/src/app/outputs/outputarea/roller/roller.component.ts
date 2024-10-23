import { Component, Input } from '@angular/core';
import { MULTI_RV_DATA } from '../outputarea.component';

@Component({
  selector: 'app-roller',
  templateUrl: './roller.component.html',
  styleUrl: './roller.component.scss'
})
export class RollerComponent {

  _rollerData: MULTI_RV_DATA|undefined;  // INPUT
  @Input() 
  set rollerData(data: MULTI_RV_DATA|undefined) {
    this._rollerData = data;
    const names = data?.id_order?.map(id => ({label: data.rvs[id].named, value: id}));
    if (!!names && names.length > 0) {
      this.outputsDropdown = names;
      this.selectedOutput = names[0].value;
      this.isDisplayed = true;
    } else {
      this.outputsDropdown = [];
      this.selectedOutput = undefined;
      this.isDisplayed = false;
    }
  }

  isDisplayed = false;

  outputsDropdown: {label: string, value: string}[] = [];
  selectedOutput: string|undefined;
  inputNumber: number|undefined;
  rollResults: {id: number, name: string, roll: string}[] = [];
  // rollResult: string|undefined;

  trackByFn(index: number, item: {id: number, name: string, roll: string}) {
    return item.id;
  }

  private uuid = 0;
  rollDice() {
    if (!this._rollerData || !this.selectedOutput || !this.inputNumber || this.inputNumber < 1) {
      return;
    }
    const rv = this._rollerData.rvs[this.selectedOutput];
    const vals = rv.atmost.map(x => x[0]);
    const cdf = rv.atmost.map(x => x[1]);
    const results = Array.from({length: this.inputNumber}, () => weighted_random(vals, cdf));
    const rollResult = results.join(', ');
    this.rollResults.unshift({id: this.uuid++, name: rv.named, roll: rollResult});
  }
}


function weighted_random<T>(items: T[], atmost: number[]): T {
  const random = Math.random() * atmost[atmost.length - 1];
  let i;
  for (i = 0; i < atmost.length; i++)
      if (atmost[i] > random)
          break;
  return items[i];
}