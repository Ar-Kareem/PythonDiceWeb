import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, from, Observable, of, Subject, take } from 'rxjs';


enum WorkerStatus {
  IDLE,
  BUSY,
}

@Injectable({
  providedIn: 'root'
})
export class PyodideService {

  constructor() {  }

  private worker: Worker|undefined;
  private currentWorkerStatus: WorkerStatus|undefined;

  async initLoadPyodide() {
    this.recreateWorker();
  }

  recreateWorker() {
    if (!!this.worker) {
      if (this.currentWorkerStatus === WorkerStatus.IDLE) {
        console.log('worker already idle');
        return;
      } else {
        console.log('terminating last worker and craeting new one');
        this.worker.terminate();
      }
    }
    this.currentWorkerStatus = WorkerStatus.IDLE;
    this.worker = new Worker(new URL('./webwork.worker', import.meta.url), { type: 'classic' });
    this.worker.postMessage('init');
  }

  exec_dice_code(code: string) {
    this.recreateWorker();
    if (!this.worker) {
      throw new Error('Should not happen');
    }
    this.currentWorkerStatus = WorkerStatus.BUSY;
    const result$ = new Subject<any>();

    this.worker.onmessage = ({ data }) => {
      if (data.error) {
        result$.error(data.error);
        this.currentWorkerStatus = WorkerStatus.IDLE;
      } else {
        result$.next(data);
        result$.complete();
        this.currentWorkerStatus = WorkerStatus.IDLE;
      }
    };
    this.worker.postMessage({ code });
    return result$.asObservable();
  }
}