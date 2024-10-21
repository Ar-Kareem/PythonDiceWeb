import { Injectable } from '@angular/core';
import { CodeApiActions } from '@app/heroes/heros.reducer';
import { Store } from '@ngrx/store';
import { BehaviorSubject, filter, firstValueFrom, from, Observable, of, ReplaySubject, Subject, take } from 'rxjs';


enum WorkerStatus {
  INIT_NO_REQUEST = 'INIT_NO_REQUEST',
  INIT_WITH_REQUEST = 'INIT_WITH_REQUEST',  // worker is being created and a request is pending
  IDLE = 'IDLE',
  BUSY = 'BUSY',
}

@Injectable({
  providedIn: 'root'
})
export class PyodideService {

  constructor(
    private store: Store,
  ) {  }

  private worker: Worker|undefined;
  private currentWorkerStatus: WorkerStatus|undefined;
  private postMsgCounter = 0;
  private postMsg$ = new ReplaySubject<any>(1);  // contains last message from worker

  setWorkerStatus(status: WorkerStatus) {
    this.store.dispatch(CodeApiActions.setWorkerStatus({ status }));
    this.currentWorkerStatus = status;
  }

  initLoadPyodide() {
    this.recreateWorker();
  }

  recreateWorker() {
    if (!!this.worker) {
      if (this.currentWorkerStatus === WorkerStatus.IDLE) {
        console.log('worker already idle');
        return;
      } else if (this.currentWorkerStatus === WorkerStatus.INIT_NO_REQUEST) {
        console.log('worker is being created, request will be sent after init');
        this.setWorkerStatus(WorkerStatus.INIT_WITH_REQUEST);
        return;
      } else {
        // BUSY or INIT_WITH_REQUEST
        console.log('terminating last worker and craeting new one');
        this.worker.terminate();
      }
    }
    const newWorker = new Worker(new URL('./webwork.worker', import.meta.url), { type: 'classic' });
    newWorker.onmessage = ({ data }) => {
      if ( typeof data.key !== 'number' ) {
        console.error('Invalid data from worker', data);
        return;
      }
      console.log('got key', data.key);
      this.postMsg$.next(data);
      this.setWorkerStatus(WorkerStatus.IDLE);
    }
    newWorker.onerror = (error) => {console.error('Error in worker. cant handle...', error)}
    this.setWorkerStatus(WorkerStatus.INIT_NO_REQUEST);  // worker is being created, worker will respond when init is done which will set to IDLE
    newWorker.postMessage({ key: this.postMsgCounter++, api: 'INIT' });
    this.worker = newWorker;
  }

  exec_dice_code(code: string) {
    return this.worker_post_msg('EXEC_DICE_CODE', code);
  }

  exec_python_code(code: string) {
    return this.worker_post_msg('EXEC_PYTHON_CODE', code);
  }

  translate_dice_code(code: string) {
    return this.worker_post_msg('TRANSLATE_DICE_CODE', code);
  }

  worker_post_msg(api: string, api_data?: any) {
    this.recreateWorker();  // recreate worker if it is busy
    this.setWorkerStatus(WorkerStatus.BUSY);
    this.postMsgCounter++;  // unique key for this message
    this.worker!.postMessage({ key: this.postMsgCounter, api_data, api });
    return this.worker_res_as_observable(this.postMsgCounter);
  }

  worker_res_as_observable(key: number) {
    // below return an observable that emits the first message with the key and then completes
    return new Observable((subscriber) => {
      this.postMsg$.pipe(
        filter(data => data.key === key),
        take(1),
      ).subscribe( data => {
        if (data.error) {
          subscriber.error(data.error);
        } else {
          subscriber.next(data);
          subscriber.complete();
        }
      });
    });
  }
}