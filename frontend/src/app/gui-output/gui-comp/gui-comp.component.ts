import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
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
  
  @Input() displayOnly: boolean = true;
  _inputGUI: GUIElement | null = null;
  @Input()
  set inputGUI(inpGUI: GUIElement | null) {
    this._inputGUI = inpGUI;
    if (!!inpGUI && this.hasName(inpGUI) && inpGUI.varname !== this.varName) {  // if varname has changed
      this.varName = inpGUI.varname;
      this.subscribeToStoreVarName(inpGUI.varname);
    }
    if (!!inpGUI && this.hasDefaultVal(inpGUI) && inpGUI.defaultVal !== this.origDefaultVal) {  // if default value has changed
      // console.log('INPUT CHANGE', this.varName, 'default set to', inpGUI.defaultVal);
      this.varValue = inpGUI.defaultVal;
      this.origDefaultVal = inpGUI.defaultVal;
    }
  }

  varName: string | null = null;
  origDefaultVal: string | number | boolean | null = null;
  varValue: string | number | boolean | null = 0;

  constructor (private store: Store, private cd: ChangeDetectorRef) {}

  ngAfterViewInit() {
    console.log('GUI COMP INIT', this._inputGUI === null, this.displayOnly);
  }

  private ngDestroyed$ = new Subject();
  subscribeToStoreVarName(varname: string) {
    // new subscription, unsubscribe from previous
    this.ngDestroyed$.next(0);
    this.store.select(herosSelectors.selectSingleGUIVariable(varname))
    .pipe(
      takeUntil(this.ngDestroyed$),
      filter((value) => value !== undefined)
    ).subscribe((value) => {
      // console.log('STORE CHANGE', 'subscribed to', varname, 'got', value);
      this.varValue = value;
      this.cd.detectChanges();
    });
  }

  onVarValueChange(event: any) {
    this.varValue = event;
    // console.log('GUI CHANGE', this.displayOnly?'dryrun':'prod', this.varName, 'set to', this.varValue);
    if (!this.varName) {
      console.log('ERROR: varName not set');
      return;
    }
    if (!this.displayOnly) {
      this.store.dispatch(SidebarActions.gUIVariableChange({ varname: this.varName, value: this.varValue }));
    }
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
