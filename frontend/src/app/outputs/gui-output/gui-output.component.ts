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
      filter(code => code.trim().length > 0),
    ).subscribe((code) => {
      this.compileCode(code);
    });
  }

  private compileCode(code: string): void {
    const result = compileXML(code);
    // const result2 = compileYaml(code);
    // const result = !!result2.compiledGUI ? result2 : result1;
    this.parseError = null;
    this.compiledGUI = null;
    if (!!result.parseError) {
      this.parseError = result.parseError;
      this.errorOverlayPanel!.show(new MouseEvent('click'), this.overlayTarget!.nativeElement);
    } else if (!!result.error) {
      console.assert(false, 'should never happen');
      throw result.error;
    } else if (!!result.compiledGUI) {
      this.compiledGUI = result.compiledGUI;
      this.store.dispatch(SidebarActions.setGUITree({ element: result.compiledGUI }));
      this.errorOverlayPanel!.hide();  // everything is fine, hide the error overlay
    } else {
      throw new Error('Unexpected error: either parseError or compiledGUI should be set');
    }
  }
}

function compileYaml(rootYml: string) {
  const result: {
    compiledGUI: GUIElement | null,
    parseError: string | null | undefined,
    error: unknown,
  } = {
    compiledGUI: null,
    parseError: undefined,
    error: undefined,
  }

  return result;
}

function compileXML(rootxml: string) {
  const result: {
    compiledGUI: GUIElement | null,
    parseError: string | null | undefined,
    error: unknown,
  } = {
    compiledGUI: null,
    parseError: undefined,
    error: undefined,
  }
  // wrap rootxml with <box>
  rootxml = `<root>${rootxml}</root>`;
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(rootxml, 'application/xml');
  result.parseError = xmlDoc.querySelector("parsererror")?.textContent
  if (!!result.parseError) {
    const lines = result.parseError.split('\n').filter((line, i) => i != 1);  // remove the second line with URL
    lines[1] = lines[1].replace('\:', ':\n');  // split the line with colon
    result.parseError = lines.join('\n');
  } else {
    try {
      result.compiledGUI = xmldocToGUIElement(rootxml);
    } catch (error) {
      if (error instanceof ParseError) {
        result.parseError = error.message;
      } else {
        result.error = error;
      }
    }
  }
  return result;
}