import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, OnDestroy  } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { filter, Observable, Subject, takeUntil, throttleTime } from 'rxjs';

import { CodeApiActions, herosSelectors, SidebarActions } from './heros.reducer';
import { ITab, tabviewActions, tabviewSelectors } from '@app/tabview/tabview.reducer';
import { ToastActions } from '@app/toast/toast.reducer';
import { TabTitles } from '@app/tabview/tabview.component';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrl: './heroes.component.scss'
})
export class HeroesComponent implements AfterViewInit, OnDestroy {
  private readonly LOADING = 'Loading...';
  readonly TabsWithInput: string[] = [TabTitles.DICE_CODE, TabTitles.PYTHON, TabTitles.GUI];
  readonly TabTitles = TabTitles;

  private inputSubject = new Subject<{title: string, content: string}>();  // for saving to localstorage
  ngContentsInput = new Map<string, string>();  // for input textareas

  isLoading = false;
  loadExecTime: number|undefined;

  allTabs: ITab[] = [];  // from store
  selectedTabIndex: number|undefined;  // from store
  selectedTab: ITab|null = null;  // from store
  gUIVariables: { [varname: string]: any } | null = null;  // from store

  sidebarVisible$: Observable<boolean> = this.store.select(herosSelectors.selectSidebarVisible);
  private destroyed$ = new Subject<boolean>();
  constructor(
    private cd: ChangeDetectorRef, 
    private store: Store, 
    private actions$: Actions,
    private route: ActivatedRoute,
  ) { }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      (window as any).heros = this
      // mobile: hide sidebar by default
      const sideBarInitStatus = window.innerWidth > 800;
      this.store.dispatch(SidebarActions.setSidebar({ newState: sideBarInitStatus }));
    }

    this.route.paramMap.subscribe(
      (params) => {
        if (typeof localStorage === 'undefined') {  // SSR
          return;
        }
        const progId = params.get('progId');
        if (!!progId) {
          console.log('progId:', progId, 'loading program');
          // TODO check if progId is valid
          this.store.dispatch(CodeApiActions.getProgramRequest({ id: progId }));
        } else {
          console.log('progId:', progId, 'loading from localstorage');
          this.initFromLocalStorage();
        }
      }
    );

    this.store.select(herosSelectors.selectProgResponse).subscribe((data) => 
      this.handleSharedProg(data)
    );

    this.actions$.pipe(
      ofType(tabviewActions.toPythonButtonClicked),
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      this.onTranslateRequest();
    });

    this.actions$.pipe(
      ofType(tabviewActions.shareCodeButtonClicked),
      takeUntil(this.destroyed$),
    ).subscribe(({tabTitles}) => {
      this.onSaveProg(tabTitles);
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
      filter(payload => !!payload)  // filter out null values
    ).subscribe((payload) => {
      const data = payload.response
      this.isLoading = false;
      this.loadExecTime = data.time/1000;
      this.store.dispatch(SidebarActions.setCurrentResponse({ response: {text: data.result, rvs: data.rvs, title: payload.tabTitle}}))
      this.cd.detectChanges();
    });

    this.store.select(herosSelectors.selectDiceExecFailure).pipe(
      filter(error => !!error)  // filter out null values
    ).subscribe(({error, inp_code, tabTitle}) => {
      this.isLoading = false;
      this.loadExecTime = undefined;
      this.store.dispatch(SidebarActions.setCurrentResponse({ response: {text: this.getServerErrorMsg(error, inp_code), title: tabTitle}}))
      this.cd.detectChanges();
    });

    this.store.select(herosSelectors.selectServTranslateRes).pipe(
      filter(data => !!data)  // filter out null values
    ).subscribe((data) => {
      if (!data.err) {  // translation successful
        this.onInputChange(data.response.result, TabTitles.PYTHON);
        this.isLoading = false;
        this.loadExecTime = undefined;
        this.store.dispatch(SidebarActions.setCurrentResponse({ response: {text: '', title: TabTitles.PYTHON}}))
        const pythonActiveIndex = this.allTabs.findIndex(tab => tab.title === TabTitles.PYTHON);
        if (pythonActiveIndex !== -1) {  // change existing tab
          this.store.dispatch(tabviewActions.changeActiveIndex({
            newIndex: pythonActiveIndex,
          }));
        } else {  // python tab not found, add new tab
          this.store.dispatch(tabviewActions.changeOpenTabs({
            openTabs: [...this.allTabs, {title: TabTitles.PYTHON}],
            newIndex: this.allTabs.length,
          }));
        }
        this.store.dispatch(ToastActions.successNotification({ title: 'Translation successful', message: '' }));
      } else {  // error in translation
        this.store.dispatch(ToastActions.errorNotification({ title: 'Error in translation', message: data.response.message }));
      }
    });

    this.store.select(herosSelectors.selectGUIVariables).pipe(
      filter(data => !!data)
    ).subscribe((data) => this.gUIVariables = data);

    this.inputSubject.pipe(
      throttleTime(3000, undefined, { leading: true, trailing: true }) // Save to localstorage once every 3 seconds
    ).subscribe(({title, content}) => {
      // console.log('Saving to localstorage', content.length);
      localStorage.setItem('input.' + title, content)
    });
  }
  private handleSharedProg(data: any): void {
    if (!data) {
      return;
    }
    console.log('handleSharedProg:', data);
    switch (data.command + ' | ' + data.status) {
      case 'get | success':
        try {
          const prog = JSON.parse(data.response.prog);
          let loaded: string[] = [];
          for (let title in prog) {
            this.ngContentsInput.set(title, prog[title]);
            loaded.push(title);
          }
          if (loaded.length == 0) {
            this.initFromLocalStorage();
            return;
          }
          this.store.dispatch(tabviewActions.changeOpenTabs({
            openTabs: [...loaded.map(title => ({title}))],
            newIndex: 0,
          }));
          this.onButtonClick(loaded[0])  // initial calculate on page load
          this.cd.detectChanges();
        } catch (error) {
          this.store.dispatch(ToastActions.errorNotification({ title: 'Error loading program', message: 'Invalid program data' }));
          this.initFromLocalStorage();
        }
        break;
      case 'get | error':
        if (!!(data?.error?.error)) {
          this.store.dispatch(ToastActions.errorNotification({ title: 'Error loading program', message: data.error.error }));
        } else {
          this.store.dispatch(ToastActions.errorNotification({ title: 'Error loading program', message: 'Server error' }));
        }
        this.initFromLocalStorage();
        break;
      case 'save | success':
        this.store.dispatch(ToastActions.successNotification({ title: 'Program saved', message: data.response.key }));
        break;
      case 'save | error':
        if (!!(data?.error?.error)) {
          this.store.dispatch(ToastActions.errorNotification({ title: 'Error saving program', message: data.error.error }));
        } else {
          this.store.dispatch(ToastActions.errorNotification({ title: 'Error saving program', message: 'Server error' }));
        }
        break;
      default:
        console.assert(false, 'should never happen');
        break;
    }
  }

  private initFromLocalStorage() {
    let loaded: string[] = [];
    console.log('initFromLocalStorage');
    Object.values(TabTitles).forEach((title) => {
      if (typeof localStorage == 'undefined') return;
      let content = localStorage?.getItem('input.' + title);
      if (!!content) {
        this.ngContentsInput.set(title, content);
        loaded.push(title);
      }
    });
    // if no code, set default code
    if (loaded.length === 0) {
      this.ngContentsInput.set(TabTitles.DICE_CODE, `\\ example code \\ 
output 1d20 named "Just D20"
output 3 @ 4d20 named "3rd of 4D20"

function: dmg D:n saveroll S:n savetarget T:n {
  if S >= T {
    result: D/2
  } else {
    result: D
  }
}

output [dmg 4d6 saveroll d20+4 savetarget 16] named "Lvl 4 Fireball, +4DEX vs 16DC"`);
      loaded.unshift(TabTitles.DICE_CODE);  // add to front
    }
    // update tabs
    console.assert(loaded.length > 0, 'should never happen');
    if (typeof localStorage !== 'undefined') {
      let selectedTabIndex = parseInt(localStorage.getItem('selectedTabIndex') || '0');
      selectedTabIndex = Math.min(selectedTabIndex, loaded.length - 1);
      this.store.dispatch(tabviewActions.changeOpenTabs({
        openTabs: [...loaded.map(title => ({title}))],
        newIndex: selectedTabIndex,
      }));
      const selectedTitle = loaded[selectedTabIndex];
      this.onButtonClick(selectedTitle)  // initial calculate on page load
    }
    this.cd.detectChanges();
  }

  private getServerErrorMsg(response: any, inp_code: string) {
    console.log('Error:', response);
    console.log('Input code:', inp_code);
    let code = response.message;
    let payload = response.payload;
    if (code === 'EMPTY') {
      return '';
    } else if (code === 'CUSTOM') {
      return payload;
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
        return `Runtime Error:\n${payload.message}`;
      }
    } else {
      return `Error encountered (sorry for the horrible error messages, will improve this in future updates):\n\n${response}`;
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

  toggleSidebar() {
    this.store.dispatch(SidebarActions.toggleSidebar());
  }

  private onGUIExec() {
    const tabTitle = TabTitles.DICE_CODE;  // todo later get from code
    let toExec = this.ngContentsInput.get(tabTitle);
    if (!toExec || toExec.trim() === '') {
      this.store.dispatch(ToastActions.warningNotification({ title: 'No code to execute', message: '' }));
      return;
    }
    // console.log('to exec before replace', toExec);
    // console.log('GUIVariables:', this.gUIVariables);
    let cancelExec = false;
    for (let varname in this.gUIVariables) {
      const valueStr = this.gUIVariables[varname];
      let value;
      if (valueStr === true || valueStr === false) {
        value = 1 * valueStr;
      } else {
        value = parseInt(valueStr);
      }
      if (isNaN(value)) {
        this.store.dispatch(ToastActions.warningNotification({ title: `Invalid value for '${varname}'`, message: '' }));
        cancelExec = true;
        continue;
      }
      // replace "VARNAME: ..." to "VARNAME: VALUE"
      const regexp = new RegExp(`(^|\\s|{)${varname}:[^\\n]*`, 'g');
      const count = (toExec.match(regexp) || []).length;
      if (count === 0) {
        this.store.dispatch(ToastActions.warningNotification({ title: `Variable '${varname}' not found`, message: '' }));
        cancelExec = true;
        continue;
      } else if (count > 1) {
        this.store.dispatch(ToastActions.warningNotification({ title: `Multiple '${varname}'`, message: `Found ${count} counts` }));
        cancelExec = true;
      }
      toExec = toExec.replace(regexp, `$1${varname}: ${value}`);
    }
    if (cancelExec) {
      return;
    }
    this.isLoading = true;
    this.loadExecTime = undefined;
    this.store.dispatch(SidebarActions.setCurrentResponse({ response: {text: this.LOADING, title: TabTitles.GUISHOW}}))
    this.store.dispatch(CodeApiActions.execDiceCodeRequest({ code: toExec, tabTitle: TabTitles.GUISHOW }));
  }

  onButtonClick(title?: string) {
    title = title || this.selectedTab?.title;
    if (!title) {
      this.store.dispatch(ToastActions.errorNotification({ title: 'No tab selected', message: '' }));
      return;
    }
    if (title === TabTitles.GUISHOW) {
      this.onGUIExec();
      return;
    }
    const toExec = this.ngContentsInput.get(title);
    if (!toExec || toExec.trim() === '') {
      this.store.dispatch(ToastActions.warningNotification({ title: 'No code to execute', message: '' }));
      return;
    }
    if (title === TabTitles.DICE_CODE) {
      this.isLoading = true;
      this.loadExecTime = undefined;
      this.store.dispatch(SidebarActions.setCurrentResponse({ response: {text: this.LOADING, title: title}}))
      this.store.dispatch(CodeApiActions.execDiceCodeRequest({ code: toExec, tabTitle: title }));
    } else if (title === TabTitles.PYTHON) {
      this.isLoading = true;
      this.loadExecTime = undefined;
      this.store.dispatch(SidebarActions.setCurrentResponse({ response: {text: this.LOADING, title: title}}))
      this.store.dispatch(CodeApiActions.execPythonCodeRequest({ code: toExec, tabTitle: title }));
    } else {
      this.store.dispatch(ToastActions.errorNotification({ title: 'Cant execute for this tab', message: '' }));
    }
  }

  private onTranslateRequest() {
    const title = this.selectedTab?.title;
    if (title !== TabTitles.DICE_CODE) {
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

  private onSaveProg(tabTitles: string[]) {
    let toSave: {[key: string]: string} = {};
    tabTitles.forEach((title) => {
      const content = this.ngContentsInput.get(title);
      if (content) {
        toSave[title] = content;
      }
    });
    if (Object.keys(toSave).length === 0) {
      this.store.dispatch(ToastActions.warningNotification({ title: 'No code to save', message: '' }));
      return;
    }
    // console.debug(JSON.stringify(JSON.stringify(toSave)));
    this.store.dispatch(CodeApiActions.saveProgramRequest({ prog: JSON.stringify(toSave) }));
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

}
