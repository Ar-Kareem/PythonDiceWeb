import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, ReplaySubject } from 'rxjs';
import { Store } from '@ngrx/store';
import { OverlayPanel } from 'primeng/overlaypanel';

import { ParseError, GUIElement } from '@models/GUIModels';
import { SidebarActions } from '@app/heroes/heros.reducer';
import { xmldocToGUIElement } from './parser_xml';

@Component({
  selector: 'app-gui-output',
  templateUrl: './gui-output.component.html',
  styleUrl: './gui-output.component.scss'
})
export class GuiOutputComponent implements AfterViewInit {

  @Input() set inputCode(v: string) { this.inputCode$.next(v); }
  protected readonly inputCode$ = new ReplaySubject<string>(1);

  @ViewChild('overlayTarget') overlayTarget: ElementRef | undefined;
  @ViewChild('op') errorOverlayPanel: OverlayPanel | undefined;

  compiledGUI: GUIElement | null = null;
  parseError: string | null | undefined;

  constructor(private store: Store) {
    (window as any).guiout = this;
  }

  ngAfterViewInit(): void {
    this.inputCode$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter(xml => xml.trim().length > 0),
    ).subscribe((xml) => {
      this.compileXML(xml);
    });
  }

  private compileXML(rootxml: string): void {
    // wrap rootxml with <box>
    rootxml = `<root>${rootxml}</root>`;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rootxml, 'application/xml');
    this.parseError = xmlDoc.querySelector("parsererror")?.textContent
    if (!!this.parseError) {
      const lines = this.parseError.split('\n').filter((line, i) => i != 1);  // remove the second line with URL
      lines[1] = lines[1].replace('\:', ':\n');  // split the line with colon
      this.parseError = lines.join('\n');
      this.errorOverlayPanel!.show(new MouseEvent('click'), this.overlayTarget!.nativeElement);
    } else {
      try {
        this.compiledGUI = xmldocToGUIElement(rootxml);
        this.store.dispatch(SidebarActions.setGUITree({ element: this.compiledGUI }));
        this.errorOverlayPanel!.hide();  // everything is fine, hide the error overlay
      } catch (error) {
        if (error instanceof ParseError) {
          this.parseError = error.message;
          this.errorOverlayPanel!.show(new MouseEvent('click'), this.overlayTarget!.nativeElement);
        } else {
          throw error;
        }
      }
    }
  }
}
