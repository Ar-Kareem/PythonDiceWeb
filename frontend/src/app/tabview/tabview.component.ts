import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Dropdown, DropdownChangeEvent } from 'primeng/dropdown';

import { ToastActions } from '../toast/toast.reducer';
import { ITab, tabviewActions, tabviewSelectors } from './tabview.reducer';
import { TabView } from 'primeng/tabview';


@Component({
  selector: 'app-tabview',
  templateUrl: './tabview.component.html',
  styleUrl: './tabview.component.scss'
})
export class TabviewComponent implements AfterViewInit {

  @ViewChild('dd') dropdown: Dropdown | undefined;
  @ViewChild('dd', {read: ElementRef, static:false}) dropdownElement: ElementRef | undefined;
  @ViewChild('plusBtn', {read: ElementRef, static:false}) plusBtn: ElementRef | undefined;

  ngDropdownModel: string|undefined;
  ngDropdownNamed: string[] = [];
  ngTabPanels: ITab[] = [];
  ngActiveIndex: number = 0;

  preActiveIndex: number = 0;  // only used to deny tab change
  convertBtnViewable: boolean = false;

  constructor(private cd: ChangeDetectorRef, private store: Store) { }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') (window as any).tabview = this;
    if (typeof window !== 'undefined') (window as any).tabviewActions = tabviewActions;
    this.store.select(tabviewSelectors.selectAllowedNewTabs).subscribe((allowedNewTabs) => {
      this.ngDropdownNamed = allowedNewTabs;
      this.cd.detectChanges();
    });

    this.store.select(tabviewSelectors.selectOpenTabs).subscribe((tabs) => {
      const allDropDowns = ['DiceCode', 'Python', 'GUI']
      const tabTitles = tabs.map(tab => tab.title);
      this.store.dispatch(tabviewActions.changeAllowedNewTabs({
        allowedNewTabs: allDropDowns.filter(tab => !tabTitles.includes(tab))
      }));
      this.ngTabPanels = tabs;
      this.convertBtnViewable = this.ngTabPanels[this.ngActiveIndex]?.title === 'DiceCode';
      // this.cd.detectChanges();
    });

    this.store.select(tabviewSelectors.selectActiveIndex).subscribe((index) => {
      // console.log('activeIndex is set', index);
      this.ngActiveIndex = index;
      this.preActiveIndex = index;
      this.convertBtnViewable = this.ngTabPanels[this.ngActiveIndex]?.title === 'DiceCode';
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

  onDropdownChange(event: DropdownChangeEvent) {
    let selected = event.value;
    if (selected) {
      this.store.dispatch(tabviewActions.changeOpenTabs({openTabs: [...this.ngTabPanels, {title: selected}], newIndex: this.ngTabPanels.length}));
    }
    this.cd.detectChanges();  // otherwise this.ngDropdownModel is not set to undefined and the option is still highlighted
    this.ngDropdownModel = undefined;  // reset dropdown
    this.dropdown?.hide();
    this.cd.detectChanges();  // otherwise the dropdown is not hidden
  }

  closeTab(index: number) {
    if (index >= this.ngActiveIndex && this.ngActiveIndex > 0) {
      this.store.dispatch(tabviewActions.changeActiveIndex({newIndex: this.ngActiveIndex - 1}));
    }
    this.store.dispatch(tabviewActions.changeOpenTabs({openTabs: this.ngTabPanels.filter((_, i) => i !== index)}));
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
