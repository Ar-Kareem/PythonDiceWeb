import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef  } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, Observable, Subject, throttleTime } from 'rxjs';

import { CodeApiActions, herosSelectors, SidebarActions } from './heros.reducer';


@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrl: './heroes.component.scss'
})
export class HeroesComponent implements AfterViewInit {

  @ViewChild('autoResizeTextarea') textarea: ElementRef<HTMLTextAreaElement> | undefined;

  // textarea 
  ngValue: string = `\noutput 5d2\noutput 1d20 + 1d4 + 2\noutput (1d20 + 1d4 + 2) > 10`;
  private inputSubject = new Subject<string>();
  ngResponse: string = '';

  sidebarVisible$: Observable<boolean> = this.store.select(herosSelectors.selectSidebarVisible);
  constructor(private cd: ChangeDetectorRef, private store: Store) {
    this.sidebarVisible$.subscribe(() => {this.autoOutputHeight()});  // sidebar change causes output height to change
    
    this.store.select(herosSelectors.selectDiceExecResult).pipe(
      filter(data => !!data)  // filter out null values
    ).subscribe((data) => {
      this.setResponse(data.result);
      console.log('Python code:\n', data.parsed);
      console.log('Python time:\n', data.time.toFixed(2));
    });
    
    this.store.select(herosSelectors.selectDiceExecFailure).pipe(
      filter(error => !!error)  // filter out null values
    ).subscribe(({response, inp_code}) => {
      let code = response.error.message;
      let payload = response.error.payload;
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
      } else if (code == 'RESOLVER') {
        this.setResponse(payload.message + '\nError in Resolver');
      } else if (code == 'TIMEOUT') {
        this.setResponse('Timeout: Execution took too long.');
      } else if (code == 'PYTHONERROR') {
        if (payload.message == "name '_print_' is not defined") {
          this.setResponse('Error: You cannot use print function in Python code. Use output(...) instead.');
        } else if (payload.message == "__import__ not found") {
          this.setResponse('Error: Importing is not allowed. Useful modules such as math/functools/itertools/random are already provided and can be used directly.');
        } else if (payload.message.includes('is an invalid variable name because it starts with "_"')) {
          let lineno: string = payload.message;
          lineno = lineno.split(':')[0].substring(2);
          this.setResponse(`Error: Illegal variable name in ${lineno}, variables cannot start with an "_".`);
        } else {
          this.setResponse('Error in Python:\n' + payload.message);
        }
      } else {
        this.setResponse(`Unexpected Error: ${response.error}`);
      }
      console.log('Error:', response);
      console.log('Input code:', inp_code);
    });

    this.inputSubject.pipe(
      throttleTime(3000) // Save to localstorage once every 3 seconds
    ).subscribe((value: string) => {console.log('Saving to localstorage', value.length);localStorage.setItem('input', value)});
  }


  ngOnInit(): void {
    if (typeof window !== 'undefined') {(window as any).heros = this}
  }

  ngAfterViewInit() {
    this.autoOutputHeight();
    
    if (typeof localStorage !== 'undefined' && localStorage.getItem('input')) {
      this.ngValue = localStorage.getItem('input') || '';
      this.cd.detectChanges();
    }
  }

  saveInputLocalStorage(event: Event) {
    this.inputSubject.next((event.target as HTMLTextAreaElement).value); 
  }

  autoOutputHeight() {
    console.log('autoOutputHeight');
    if (!this.textarea) {
      return;
    }
    const textarea = this.textarea.nativeElement;
    textarea.style.height = 'auto'; // Reset height to auto to shrink if needed
    textarea.style.height = `${textarea.scrollHeight + 4}px`; // Set height based on scrollHeight
    this.cd.detectChanges();
  }

  toggleSidebar() {
    this.store.dispatch(SidebarActions.toggleSidebar());
  }

  setResponse(response: string) {
    this.ngResponse = response;
    this.autoOutputHeight();
  }

  onButtonClick() {
    this.setResponse('Loading...');
    this.store.dispatch(CodeApiActions.execDiceCodeRequest({ code: this.ngValue }));
    // this.store.dispatch(CodeApiActions.execPythonCodeRequest({ code: this.ngValue }));
  }

}
