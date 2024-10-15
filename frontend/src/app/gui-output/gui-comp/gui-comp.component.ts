import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { ElemTypes, GUIElement } from '../../../models/GUIModels';
import { herosSelectors, SidebarActions } from '../../heroes/heros.reducer';

@Component({
  selector: 'app-gui-comp',
  templateUrl: './gui-comp.component.html',
  styleUrl: './gui-comp.component.scss'
})
export class GuiCompComponent {

  public readonly TYPES = ElemTypes

  _inputGUI: GUIElement | null = null;
  @Input()
  set inputGUI(inpGUI: GUIElement | null) {
    this._inputGUI = inpGUI;
    if (!!inpGUI && this.hasDefaultVal(inpGUI) && inpGUI.defaultVal !== this.origDefaultVal) {  // if default value has changed
      // console.log('INPUT CHANGE', this.varName, 'default set to', inpGUI.defaultVal);
      this.origDefaultVal = inpGUI.defaultVal;
    }
    if (!!inpGUI && this.hasName(inpGUI) && inpGUI.varname !== this.varName) {  // if varname has changed
      this.varName = inpGUI.varname;
      this.subscribeToStoreVarName(inpGUI.varname);
    }
  }

  varName: string | null = null;  // from @Input inputGUI
  origDefaultVal: string | number | boolean | null = null;  // from @Input inputGUI
  varValue: string | number | boolean | null = null;  // from store

  ngVarValue: string | number | boolean | null = null;  // for ngModel

  private prev: Subscription | undefined;  // for unsubscribing when varName changes
  constructor (private store: Store, private cd: ChangeDetectorRef) {}


  subscribeToStoreVarName(varname: string) {
    // console.log('GUI; SUBSCRIBING!!! to', varname, 'prev sub:', this.prev);
    if (!!this.prev) {
      this.prev.unsubscribe();
    }
    this.prev = this.store.select(herosSelectors.factorySelectSingleGUIVariable(varname))
    .subscribe((value) => {
      if (value !== null && value !== undefined) {
        this.varValue = value;
        this.ngVarValue = value;
        // console.log('GUI; from store got', this.varName, '=', this.varValue);
      }
      this.cd.detectChanges();
    });
  }

  onVarValueChange(event: any) {
    if (this.varValue === event) {
      return;
    }
    // console.log('GUI; dispatching', this.varName, this.varValue, '->', event);
    if (!this.varName) {
      console.log('ERROR: varName not set');
      return;
    }
    this.store.dispatch(SidebarActions.gUIVariableChange({ varname: this.varName, value: event }));
  }

  ALWAYTRUE(index: number, item: any): any {
    return true;
  }

  // TYPE GUARDS
  private hasName(object: any): object is { varname: string } {
    return 'varname' in object;
  }
  private hasDefaultVal(object: any): object is { defaultVal: string }  {
    return 'defaultVal' in object;
  }


}
