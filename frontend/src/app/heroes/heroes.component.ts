import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, OnDestroy  } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { filter, Observable, Subject, takeUntil, throttleTime } from 'rxjs';

import { CodeApiActions, herosSelectors, SidebarActions } from './heros.reducer';
import { ITab, tabviewActions, tabviewSelectors } from '../tabview/tabview.reducer';
import { ToastActions } from '../toast/toast.reducer';


@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrl: './heroes.component.scss'
})
export class HeroesComponent implements AfterViewInit, OnDestroy {
  private readonly LOADING = 'Loading...';

  @ViewChild('autoResizeTextarea') textarea: ElementRef<HTMLTextAreaElement> | undefined;

  private inputSubject = new Subject<{title: string, content: string}>();
  ngContentsInput = new Map<string, string>();
  ngContentsOutput = new Map<string, string>();

  isLoading = false;
  selectedTabIndex: number|undefined;
  allTabs: ITab[] = [];
  selectedTab: ITab|null = null;

  sidebarVisible$: Observable<boolean> = this.store.select(herosSelectors.selectSidebarVisible);
  private destroyed$ = new Subject<boolean>();
  constructor(private cd: ChangeDetectorRef, private store: Store, private actions$: Actions) { }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {(window as any).heros = this}

    this.initFromLocalStorage();

    this.actions$.pipe(
      ofType(tabviewActions.toPythonButtonClicked),
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      this.onTranslateRequest();
    });

    this.sidebarVisible$.subscribe(() => {
      this.autoOutputHeight();  // sidebar change causes output height to change
    });

    this.store.select(tabviewSelectors.selectOpenTabs).subscribe((tabs) => {
      this.allTabs = tabs
      this.cd.detectChanges();
    });
    this.store.select(tabviewSelectors.selectActiveIndex).subscribe((index) => {
      this.selectedTabIndex = index
      this.cd.detectChanges();
      if (typeof localStorage !== 'undefined') {localStorage.setItem('selectedTabIndex', index.toString())};
    });
    this.store.select(tabviewSelectors.selectSelectedTab).subscribe((tab) => {
      this.selectedTab = tab
      this.cd.detectChanges();
    });

    this.store.select(herosSelectors.selectDiceExecResult).pipe(
      filter(data => !!data)  // filter out null values
    ).subscribe((data) => {
      this.isLoading = false;
      this.setResponse(data.result);
      console.log('Python code:\n', data.parsed);
      console.log('Python time:\n', data.time.toFixed(2));
    });

    this.store.select(herosSelectors.selectDiceExecFailure).pipe(
      filter(error => !!error)  // filter out null values
    ).subscribe(({response, inp_code}) => {
      this.isLoading = false;
      this.setResponse(this.getServerErrorMsg(response, inp_code));
    });

    this.store.select(herosSelectors.selectServTranslateRes).pipe(
      filter(data => !!data)  // filter out null values
    ).subscribe((data) => {
      if (!data.err) {  // translation successful
        this.onInputChange(data.response.result, 'Python');
        this.isLoading = false;
        this.setResponse('', 'Python');
        const pythonActiveIndex = this.allTabs.findIndex(tab => tab.title === 'Python');
        if (pythonActiveIndex !== -1) {  // change existing tab
          this.store.dispatch(tabviewActions.changeActiveIndex({
            newIndex: pythonActiveIndex,
          }));
        } else {  // python tab not found, add new tab
          this.store.dispatch(tabviewActions.changeOpenTabs({
            openTabs: [...this.allTabs, {title: 'Python'}],
            newIndex: this.allTabs.length,
          }));
        }
        this.store.dispatch(ToastActions.successNotification({ title: 'Translation successful', message: '' }));
      } else {  // error in translation
        this.store.dispatch(ToastActions.errorNotification({ title: 'Error in translation', message: data.response.result }));
      }
    });

    this.inputSubject.pipe(
      throttleTime(3000, undefined, { leading: true, trailing: true }) // Save to localstorage once every 3 seconds
    ).subscribe(({title, content}) => {
      // console.log('Saving to localstorage', content.length);
      localStorage.setItem('input.' + title, content)
    });

    this.autoOutputHeight();
  }

  initFromLocalStorage() {
    let loaded: string[] = [];
    console.log('initFromLocalStorage');
    ['DiceCode', 'Python', 'GUI'].forEach((title) => {
      if (typeof localStorage == 'undefined') return;
      let content = localStorage?.getItem('input.' + title);
      if (!!content) {
        this.ngContentsInput.set(title, content);
        loaded.push(title);
      }
    });
    // if no code, set default code
    if (!this.ngContentsInput.has('DiceCode')) {
      this.ngContentsInput.set('DiceCode', `\noutput 5d2\noutput 1d20 + 1d4 + 2\noutput (1d20 + 1d4 + 2) > 10`);
      loaded.push('DiceCode');
    }
    if (loaded.length > 0) {
      let selectedTabIndex = parseInt(localStorage.getItem('selectedTabIndex') || '0');
      selectedTabIndex = Math.min(selectedTabIndex, loaded.length - 1);
      this.store.dispatch(tabviewActions.changeOpenTabs({
        openTabs: [...loaded.map(title => ({title}))],
        newIndex: selectedTabIndex,
      }));
    } else {
      this.store.dispatch(tabviewActions.changeActiveIndex({newIndex: 0}));  // initial tab
    }
    this.cd.detectChanges();
  }

  getServerErrorMsg(response: any, inp_code: string) {
    console.log('Error:', response);
    console.log('Input code:', inp_code);
    let code = response.error.message;
    let payload = response.error.payload;
    if (code === 'EMPTY') {
      return '';
    } else if (code === 'LEX') {
      let char = payload[0][0];
      let linepos = payload[0][2];
      let code_snippet = inp_code.split('\n')[linepos-1];
      return `Illegal Character found "${char}" in line number ${linepos}.\nCode snippet:\n${code_snippet}`;
    } else if (code === 'YACC') {
      if (payload.length > 0) {
        let char = payload[0][0];
        let linepos = payload[0][2];
        let code_snippet = inp_code.split('\n').slice(linepos-1, linepos+2).join('\n');
        return `Illegal Token found. The error started in "${char}" in line number ${linepos}.\nCode snippet:\n${code_snippet}`;
      } else {  // YACC EOF error
        return 'Unexpected EOF while parsing.\nAre you missing a closing bracket? Or not finishing the last statement?';
      }
    } else if (code == 'RESOLVER') {
      return payload.message + '\nError in Resolver';
    } else if (code == 'TIMEOUT') {
      return 'Timeout: Execution took too long.';
    } else if (code == 'PYTHONERROR') {
      if (payload.message == "name '_print_' is not defined") {
        return 'Error: You cannot use print function in Python code. Use output(...) instead.';
      } else if (payload.message == "__import__ not found") {
        return 'Error: Importing is not allowed. Useful modules such as math/functools/itertools/random are already provided and can be used directly.';
      } else if (payload.message.includes('is an invalid variable name because it starts with "_"')) {
        let lineno: string = payload.message;
        lineno = lineno.split(':')[0].substring(2);
        return `Error: Illegal variable name in ${lineno}, variables cannot start with an "_".`;
      } else {
        return 'Error in Python:\n' + payload.message;
      }
    } else {
      return `Unexpected Error: ${response}`;
    }
  }

  onInputChange(event: string, tabTitle: string) {
    this.ngContentsInput.set(tabTitle, event);
    this.inputSubject.next({title: tabTitle, content: event});
  }

  onInputKeyPress($event: Event, type: 'tab' | 'enter' | 'shift-enter') {
    if (type === 'tab') {
      document.execCommand("insertText", false, '  ');  // insert 2 spaces
      $event.preventDefault();
    } else if (type === 'enter') {
      const textarea = $event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const lastLine = textarea.value.substring(0, start).split('\n').pop()!;
      const numSpaces = lastLine.match(/^\s*/)![0].length;
      const spaces = ' '.repeat(numSpaces);
      document.execCommand("insertText", false, '\n' + spaces);  // insert newline with same indentation
      $event.preventDefault();
    } else if (type === 'shift-enter') {
      this.onButtonClick();
      $event.preventDefault();
    }
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

  setResponse(response: string, title?: string) {
    title = title || this.selectedTab?.title;
    if (!title) {  // no tab selected
      console.error('No tab selected!!!');
      return;
    }
    this.ngContentsOutput.set(title, response);
    this.autoOutputHeight();
  }

  onButtonClick() {
    const title = this.selectedTab?.title;
    if (!title) {
      this.store.dispatch(ToastActions.errorNotification({ title: 'No tab selected', message: '' }));
      return;
    }
    const toExec = this.ngContentsInput.get(title);
    if (!toExec || toExec.trim() === '') {
      this.store.dispatch(ToastActions.warningNotification({ title: 'No code to execute', message: '' }));
      return;
    }
    if (title === 'DiceCode') {
      this.store.dispatch(CodeApiActions.execDiceCodeRequest({ code: toExec }));
      this.isLoading = true;
      this.setResponse(this.LOADING);
    } else if (title === 'Python') {
      this.store.dispatch(CodeApiActions.execPythonCodeRequest({ code: toExec }));
      this.isLoading = true;
      this.setResponse(this.LOADING);
    } else {
      this.store.dispatch(ToastActions.errorNotification({ title: 'Cant execute for this tab', message: '' }));
    }
  }

  onTranslateRequest() {
    const title = this.selectedTab?.title;
    if (title !== 'DiceCode') {
      this.store.dispatch(ToastActions.errorNotification({ title: 'Can only translate DiceCode', message: '' }));
      return;
    }
    const toTranslate = this.ngContentsInput.get(title);
    if (!toTranslate || toTranslate.trim() === '') {
      this.store.dispatch(ToastActions.warningNotification({ title: 'No code to translate', message: '' }));
      return;
    }
    this.store.dispatch(CodeApiActions.translateDiceCodeRequest({ code: toTranslate }));
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

}
