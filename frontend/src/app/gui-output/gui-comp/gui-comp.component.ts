import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ElemTypes, GUIElement } from '../GUIModels';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-gui-comp',
  templateUrl: './gui-comp.component.html',
  styleUrl: './gui-comp.component.scss'
})
export class GuiCompComponent implements OnInit {
  
  public readonly TYPES = ElemTypes
  
  @Input() displayOnly: boolean = true;
  _inputGUI: GUIElement | null = null;
  @Input()
  set inputGUI(inpGUI: GUIElement | null) {
    this._inputGUI = inpGUI;
    if (!!inpGUI && this.hasName(inpGUI)) {
      this.varName = inpGUI.varname;
    }
    if (!!inpGUI && this.hasDefaultVal(inpGUI) && inpGUI.defaultVal !== this.origDefaultVal) {  // if default value has changed
      console.log(this.varName, 'default set to', inpGUI.defaultVal);
      this.varValue = inpGUI.defaultVal;
      this.origDefaultVal = inpGUI.defaultVal;
    }
  }

  varName: string | null = null;
  origDefaultVal: string | number | boolean | null = null;
  varValue: string | number | boolean | null = 0;

  constructor (private store: Store, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    console.log('GUIComp init');
  }

  onVarValueChange(event: any) {
    this.varValue = event;
    console.log(this.displayOnly, this.varName, 'set to', this.varValue);
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
