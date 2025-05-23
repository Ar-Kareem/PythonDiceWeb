import { AfterViewInit, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { ConfirmationService, MessageService } from 'primeng/api';

import { selectMsgServiceState } from './toast.reducer';


@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  providers: [MessageService, ConfirmationService]
})
export class ToastComponent implements AfterViewInit {

  constructor(
    private store: Store, 
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
  ) { }

  dialogSettings = {
    visible: false,
    title: '',
    message: '',
    callback: () => {},
  }

  ngAfterViewInit(): void {
    this.store.select(selectMsgServiceState).subscribe((state) => {
      if (state.visible && state.type === 'dialog') {
        this.confirmationService.confirm({
          message: state.message?.message,
          header: state.message?.title,
          accept: () => state.callback?.onConfirm(),
          reject: () => state.callback?.onReject()
        });
      } else if (state.visible && state.type === 'dialog-dismiss') {
        this.dialogSettings.visible = true;
        this.dialogSettings.callback = !!state.callback ? state.callback.onConfirm : () => {};
        this.dialogSettings.title = state.message?.title || '';
        this.dialogSettings.message = state.message?.message || '';
      } else if (state.visible) {
        this.messageService.add({ severity: state.type, summary: state.message?.title, detail: state.message?.message });
      }
    });
  }

  onHide() {
    // this.store.dispatch(ToastActions.hideToast());
  }

}
