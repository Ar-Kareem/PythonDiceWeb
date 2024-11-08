import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Dropdown, DropdownChangeEvent } from 'primeng/dropdown';

import { ToastActions } from '@app/toast/toast.reducer';
import { ITab, tabviewActions, tabviewSelectors } from './tabview.reducer';
import { herosSelectors } from '@app/heroes/heros.reducer';

export enum TabTitles {
  DICE_CODE = 'DiceCode',
  PYTHON = 'Python',
  GUI = 'GUI Editor',
  GUISHOW = 'GUI Output',
}
const AllDropDowns = [TabTitles.DICE_CODE, TabTitles.PYTHON, TabTitles.GUI];

@Component({
  selector: 'app-tabview',
  templateUrl: './tabview.component.html',
  styleUrl: './tabview.component.scss'
})
export class TabviewComponent implements AfterViewInit {
  readonly TabTitles = TabTitles;

  @ViewChild('dd') dropdown: Dropdown | undefined;
  @ViewChild('dd', {read: ElementRef, static:false}) dropdownElement: ElementRef | undefined;
  @ViewChild('plusBtn', {read: ElementRef, static:false}) plusBtn: ElementRef | undefined;

  ngDropdownModel: string|undefined;  // ngModel
  ngDropdownNamed: string[] = [];
  ngTabPanels: ITab[] = [];
  ngActiveIndex: number = 0;

  ngShareRaioModel: string|undefined;  // ngModel
  ngShareCheckboxModel: string[] = [];  // ngModel

  preActiveIndex: number = 0;  // only used to deny tab change
  convertBtnViewable: boolean = false;
  SharingDisabledStatus: {python: boolean, dice: boolean, gui: boolean} = {python: false, dice: false, gui: false};
  sharedURL: string|undefined;

  constructor(private cd: ChangeDetectorRef, private store: Store) { }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') (window as any).tabview = this;
    if (typeof window !== 'undefined') (window as any).tabviewActions = tabviewActions;
    this.store.select(tabviewSelectors.selectAllowedNewTabs).subscribe((allowedNewTabs) => {
      this.ngDropdownNamed = allowedNewTabs;
      this.cd.detectChanges();
    });

    this.store.select(herosSelectors.selectProgResponse).subscribe((data) => {
        if (data?.command === 'save' && data?.status === 'success') {
          const key = data?.response?.key;
          let curUrl = window.location.href.split('/program')[0];  // TODO implement this properly, this is a hack and will not work if more diverse URI segments are added
          if (curUrl[curUrl.length - 1] === '/') {  // remove trailing slash
            curUrl = curUrl.slice(0, -1);
          }
          this.sharedURL = !!key ? `${curUrl}/program/${key}` : undefined;
        }
      }
    );

    this.store.select(tabviewSelectors.selectOpenTabs).subscribe((tabs) => {
      const curTabTitles = tabs.map(tab => tab.title);
      this.store.dispatch(tabviewActions.changeAllowedNewTabs({
        allowedNewTabs: AllDropDowns.filter(tab => !curTabTitles.includes(tab))
      }));
      this.ngTabPanels = tabs;
      this.convertBtnViewable = this.ngTabPanels[this.ngActiveIndex]?.title === TabTitles.DICE_CODE;
      // update sharing status
      this.SharingDisabledStatus.dice = !this.ngTabPanels.some(tab => tab.title === TabTitles.DICE_CODE)
      this.SharingDisabledStatus.python = !this.ngTabPanels.some(tab => tab.title === TabTitles.PYTHON)
      this.SharingDisabledStatus.gui = !this.ngTabPanels.some(tab => tab.title === TabTitles.GUI)
      // this.cd.detectChanges();
    });

    this.store.select(tabviewSelectors.selectActiveIndex).subscribe((index) => {
      // console.log('activeIndex is set', index);
      this.ngActiveIndex = index;
      this.preActiveIndex = index;
      this.convertBtnViewable = this.ngTabPanels[this.ngActiveIndex]?.title === TabTitles.DICE_CODE;
      // this.cd.detectChanges();
    });
  }

  plusButtonClicked() {
    let br = this.plusBtn?.nativeElement.getBoundingClientRect();
    let scroll = document.documentElement.scrollTop
    this.dropdownElement!.nativeElement.style.top = br.top + scroll + 20 + 'px';
    this.dropdownElement!.nativeElement.style.left = br.left + 'px';
    this.dropdown?.show();
  }

  convertToPython() {
    this.store.dispatch(tabviewActions.toPythonButtonClicked());
  }

  onShareButtonClicked() {
    if (!this.ngShareRaioModel) {
      console.assert(false, 'should never happen');
      return;
    }
    const tabsToShare = [this.ngShareRaioModel, ...this.ngShareCheckboxModel]
    this.store.dispatch(tabviewActions.shareCodeButtonClicked({tabTitles: tabsToShare}));
  }

  copyToClipboard(text: string) {
    if (!!text) {
      navigator.clipboard.writeText(text);
    }
  }

  activeIndexChange(newIndex: number) {
    let preventTabChange = newIndex >= this.ngTabPanels.length;  // clicked on the plus button
    if (preventTabChange) {
        setTimeout(() => {
          this.ngActiveIndex = this.preActiveIndex;
        }, 0);
    } else {
      this.store.dispatch(tabviewActions.changeActiveIndex({newIndex: newIndex}));
    }
  }

  onDropdownChange(event: DropdownChangeEvent) {  // new tab selected
    const selected: string = event.value;
    if (selected) {
      const newTabs = [...this.ngTabPanels, {title: selected}];
      this.store.dispatch(tabviewActions.changeOpenTabs({openTabs: newTabs, newIndex: this.ngTabPanels.length}));
    }
    this.cd.detectChanges();  // otherwise this.ngDropdownModel is not set to undefined and the option is still highlighted
    this.ngDropdownModel = undefined;  // reset dropdown
    this.dropdown?.hide();
    this.cd.detectChanges();  // otherwise the dropdown is not hidden
  }

  closeTab(index: number) {
    let newIndex = undefined;
    if (index >= this.ngActiveIndex && this.ngActiveIndex > 0) {
      newIndex = this.ngActiveIndex - 1
    }
    this.store.dispatch(tabviewActions.changeOpenTabs({openTabs: this.ngTabPanels.filter((_, i) => i !== index), newIndex: newIndex}));
  }

  requestTabClose(index: number) {
    this.store.dispatch(ToastActions.dialogNotification({
      title: 'Tab Closed',
      message: `Are you sure you want to close the tab?`,
      callback: { 
        onConfirm: () => {
          this.closeTab(index);
        }, onReject: () => {} }
    }));
  }



}
