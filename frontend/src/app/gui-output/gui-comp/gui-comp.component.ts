import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-gui-comp',
  templateUrl: './gui-comp.component.html',
  styleUrl: './gui-comp.component.scss'
})
export class GuiCompComponent {

  @Input() inputXML: Node | null = null;

}
