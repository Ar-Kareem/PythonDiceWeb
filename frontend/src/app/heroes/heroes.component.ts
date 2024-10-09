// @ts-nocheck

import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef  } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrl: './heroes.component.scss'
})
export class HeroesComponent implements AfterViewInit {

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) { }

  sidebarVisible: boolean = true;

  @ViewChild('autoResizeTextarea') textarea: ElementRef<HTMLTextAreaElement>;

  // value is stored in primeng textarea 
  value: string = `
output 5d2
output 1d20 + 1d4 + 2
output (1d20 + 1d4 + 2) > 10
`;
  // response is stored in primeng 
  response: string = '';
  

  ngOnInit(): void {
    console.log('Welcome to the Dice App!');
    if (typeof window !== 'undefined') {
      window.heros = this;
    }
  }

  ngAfterViewInit() {
    this.autoOutputHeight();
    
    // to fix 'localStorage is not defined' error: 
    if (typeof localStorage !== 'undefined' && localStorage.getItem('input')) {
      this.value = localStorage.getItem('input');
      this.cd.detectChanges();
    }
  }

  lastSave;
  saveInputLocalStorage() {
    if (localStorage && this.lastSave && Date.now() - this.lastSave < 3000) {
      return;
    }
    console.log('saveInputLocalStorage');
    this.lastSave = Date.now();
    localStorage.setItem('input', this.value);
  }

  autoOutputHeight() {
    console.log('autoOutputHeight');
    const textarea = this.textarea.nativeElement;
    textarea.style.height = 'auto'; // Reset height to auto to shrink if needed
    textarea.style.height = `${textarea.scrollHeight + 4}px`; // Set height based on scrollHeight
    this.cd.detectChanges();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible
  }

  setResponse(response: string) {
    this.response = response;
    this.autoOutputHeight();
  }

  onButtonClick() {
    this.setResponse('Loading...');
    let inp_code = this.value;
    this.http.post<any>('/api/ParseExec', {code: inp_code}).subscribe(data => {
      this.setResponse(data.result);
      console.log('Python code:\n', data.parsed);
      console.log('Python time:\n', data.time.toFixed(2));
    }, resp => {
      let code = resp.error.message;
      let payload = resp.error.payload;
      if (code === 'EMPTY') {
        this.setResponse('');
      } else if (code === 'LEX') {
        let char = payload[0][0];
        let linepos = payload[0][2];
        let code_snippet = inp_code.split('\n')[linepos-1];
        this.setResponse(`Illegal Character found "${char}" in line number ${linepos}.\nCode snippet:\n${code_snippet}`);
      } else if (code === 'YACC') {
        if (payload.length > 0) {
          let char = payload[0][0];
          let linepos = payload[0][2];
          let code_snippet = inp_code.split('\n').slice(linepos-1, linepos+2).join('\n');
          this.setResponse(`Illegal Token found. The error started in "${char}" in line number ${linepos}.\nCode snippet:\n${code_snippet}`);
        } else {  // YACC EOF error
          this.setResponse('Unexpected EOF while parsing.\nAre you missing a closing bracket? Or not finishing the last statement?');
        }
      } else if (code == 'TIMEOUT') {
        this.setResponse('Timeout: Execution took too long.');
      } else {
        this.setResponse(`Unexpected Error: ${resp.error}`);
      }
      console.log('Error:', resp);
    })
  }

}
