import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { ToastActions } from '@app/toast/toast.reducer';
import { herosSelectors, SidebarActions } from '../heros.reducer';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  readonly SIDEBAR_ITEMS: any[] = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => this.store.dispatch(SidebarActions.setSidebar({ newState: false }))
    },
    {
      label: 'Github',
      icon: 'pi pi-github',
      url: 'https://github.com/Ar-Kareem/PythonDice'
    },
    {
      label: 'Examples',
      icon: 'pi pi-book',
      command: () => this.onExamplesClick()
    },
    {
      label: 'Support',
      icon: 'pi pi-question-circle',
      items: [
        {
          label: 'Bugs / Questions',
          icon: 'pi pi-question',
          url: 'https://github.com/Ar-Kareem/PythonDice/issues'
        },
        {
          label: 'Contact',
          icon: 'pi pi-envelope',
          url: 'mailto:arkareem2@gmail.com'
        },
        {
          label: 'Support Us',
          icon: 'pi pi-fw pi-heart',
          command: () => this.onDonateClick()
        },
      ]
    }

];

  sidebarVisible$: Observable<boolean> = this.store.select(herosSelectors.selectSidebarVisible);
  constructor(
    private store: Store, 
  ) {
    // if (typeof localStorage !== 'undefined') {
    //   setTimeout(() => {this.onExamplesClick();}, 200);
    // }
  }

  toggleSidebar() {
    this.store.dispatch(SidebarActions.toggleSidebar());
  }

  private onDonateClick() {
    this.store.dispatch(ToastActions.dialogOnlyDismissNotification({ message: 'We are currently not taking donations.\n\n Giving us a star on github is free and we greatly appreciate it.\n\n Showing us support incentivises us to improve the site.', title: 'Thank you!', callback: {
      onConfirm: () => {},
      onReject: () => {}
    }}));
  }

  private onExamplesClick() {
    this.store.dispatch(SidebarActions.setDocsVisible({ visible: true }));
  }

}
