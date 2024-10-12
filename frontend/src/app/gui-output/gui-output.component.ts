import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { debounceTime, distinctUntilChanged, filter, ReplaySubject, Subject } from 'rxjs';

@Component({
  selector: 'app-gui-output',
  templateUrl: './gui-output.component.html',
  styleUrl: './gui-output.component.scss'
})
export class GuiOutputComponent implements AfterViewInit {

  @Input() set inputXML(v: string) { this.inputXML$.next(v); }
  protected readonly inputXML$ = new ReplaySubject<string>();

  @ViewChild('overlayTarget') overlayTarget: ElementRef | undefined;
  @ViewChild('op') errorOverlayPanel: OverlayPanel | undefined;

  parseError: string | null | undefined;

  constructor() {
    (window as any).guiout = this;
  }

  ngAfterViewInit(): void {
    this.inputXML$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter(xml => xml.trim().length > 0),
    ).subscribe((xml) => {
      this.parseXML(xml);
    });
  }

  parseXML(xml: string): void {
    console.log('inputXML', xml);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    console.log('xmlDoc', xmlDoc);
    this.parseError = xmlDoc.querySelector("parsererror")?.textContent
    if (this.parseError) {
      const lines = this.parseError.split('\n').filter((line, i) => i != 1);  // remove the second line with URL
      lines[1] = lines[1].replace('\:', ':\n');  // split the line with colon
      this.parseError = lines.join('\n');
      this.errorOverlayPanel!.show(new MouseEvent('click'), this.overlayTarget!.nativeElement);
    } else {
      this.errorOverlayPanel!.hide();
    }
    this.depthFirstSearch(xmlDoc);
  }

  depthFirstSearch(node: Node, level = 0): void {
    // skip text
    if (node.nodeType === 3) {
      return
    }
    console.log(':' + ' '.repeat(level), node.nodeName, node.nodeType);
    for (let i = 0; i < node.childNodes.length; i++) {
      this.depthFirstSearch(node.childNodes[i], level + 1);
    }
  }


}
