import { AfterViewInit, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { ConfirmationService, MessageService } from 'primeng/api';

import { selectToastState } from './toast.reducer';


@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  providers: [MessageService, ConfirmationService]
})
export class ToastComponent implements AfterViewInit {

  constructor(private store: Store, private confirmationService: ConfirmationService, private messageService: MessageService) { }

  ngAfterViewInit(): void {
    this.store.select(selectToastState).subscribe((state) => {
      console.log('toast changed', state);
      if (state.visible && state.type === 'dialog') {
        this.confirmationService.confirm({
          message: state.message?.message,
          header: state.message?.title,
          accept: () => state.callback?.onConfirm(),
          reject: () => state.callback?.onReject()
        });
      } else if (state.visible) {
        this.messageService.add({ severity: state.type, summary: state.message?.title, detail: state.message?.message });
      }
    });
  }

  onHide() {
    // this.store.dispatch(ToastActions.hideToast());
  }

}
