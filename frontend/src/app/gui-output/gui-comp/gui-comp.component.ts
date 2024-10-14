import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ElemTypes, GUIElement } from '../GUIModels';
import { Store } from '@ngrx/store';
import { herosSelectors, SidebarActions } from '../../heroes/heros.reducer';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gui-comp',
  templateUrl: './gui-comp.component.html',
  styleUrl: './gui-comp.component.scss'
})
export class GuiCompComponent implements AfterViewInit {

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

  varName: string | null = null;
  origDefaultVal: string | number | boolean | null = null;
  varValue: string | number | boolean | null = 0;

  constructor (private store: Store, private cd: ChangeDetectorRef) {}

  ngAfterViewInit() {
    console.log('GUI COMP INIT', this._inputGUI === null);
  }

  private ngDestroyed$ = new Subject();
  subscribeToStoreVarName(varname: string) {
    // new subscription, unsubscribe from previous
    this.ngDestroyed$.next(0);
    this.store.select(herosSelectors.selectSingleGUIVariable(varname))
    .pipe(
      takeUntil(this.ngDestroyed$),
    ).subscribe((value) => {
      // console.log('STORE CHANGE', 'subscribed to', varname, 'got', value);
      if (value === null || value === undefined) {
        this.store.dispatch(SidebarActions.gUIVariableChange({ varname: this.varName!, value: this.origDefaultVal }));
      } else {
        this.varValue = value;
        console.log('value', this.varName, 'set to', this.varValue);
      }
      this.cd.detectChanges();
    });
  }

  onVarValueChange(event: any) {
    this.varValue = event;
    if (!this.varName) {
      console.log('ERROR: varName not set');
      return;
    }
      this.store.dispatch(SidebarActions.gUIVariableChange({ varname: this.varName, value: this.varValue }));
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
