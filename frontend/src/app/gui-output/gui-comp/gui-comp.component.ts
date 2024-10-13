import { AfterViewInit, Component, Input } from '@angular/core';
import { BoxElement, GUIElement, } from '../GUIModels';

@Component({
  selector: 'app-gui-comp',
  templateUrl: './gui-comp.component.html',
  styleUrl: './gui-comp.component.scss'
})
export class GuiCompComponent {

  @Input() inputGUI: GUIElement | null = null;

}
