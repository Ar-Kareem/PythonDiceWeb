import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Dropdown, DropdownChangeEvent } from 'primeng/dropdown';

import { ToastActions } from '../toast/toast.reducer';


@Component({
  selector: 'app-tabview',
  templateUrl: './tabview.component.html',
  styleUrl: './tabview.component.scss'
})
export class TabviewComponent {

  @ViewChild('dd') dropdown: Dropdown | undefined;
  @ViewChild('dd', {read: ElementRef, static:false}) dropdownElement: ElementRef | undefined;
  @ViewChild('plusBtn', {read: ElementRef, static:false}) plusBtn: ElementRef | undefined;

  activeIndex: number = 1;
  prevActiveIndex: number = this.activeIndex;
  scrollableTabs = [{title: 'test1'}, {title: 'test2'}, {title: 'test3'}];

  selectedDropdown: string|undefined;
  test = ['test1' , 'test2', 'test3'];

  constructor(private cd: ChangeDetectorRef, private store: Store) { }

  requestNewTab() {
    let br = this.plusBtn?.nativeElement.getBoundingClientRect();
    let scroll = document.documentElement.scrollTop
    this.dropdownElement!.nativeElement.style.top = br.top + scroll + 20 + 'px';
    this.dropdownElement!.nativeElement.style.left = br.left + 'px';
    this.dropdown?.show(true)
  }

  activeIndexChange(newIndex: number) {
    let preventTabChange = newIndex >= this.scrollableTabs.length;  // clicked on the plus button
    if (preventTabChange) {
      setTimeout(() => {
        this.activeIndex = this.prevActiveIndex;
      }, 0);
    } else {
      this.prevActiveIndex = this.activeIndex;
    }
  }

  onDropdownChange(event: DropdownChangeEvent) {
    console.log('onDropdownChange', event);
    this.cd.detectChanges();
    this.selectedDropdown = undefined;
  }

  closeTab(index: number) {
    this.scrollableTabs.splice(index, 1);
    if (index >= this.activeIndex) {
      this.activeIndex = this.activeIndex - 1;
    }
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
