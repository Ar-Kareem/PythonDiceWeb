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
    const result$ = this.worker_res_as_observable();
    this.worker!.postMessage({ code, api: 'EXEC_DICE_CODE' });
    return result$;
  }

  exec_python_code(code: string) {
    this.recreateWorker();
    const result$ = this.worker_res_as_observable();
    this.worker!.postMessage({ code, api: 'EXEC_PYTHON_CODE' });
    return result$;
  }

  translate_dice_code(code: string) {
    this.recreateWorker();
    const result$ = this.worker_res_as_observable();
    this.worker!.postMessage({ code, api: 'TRANSLATE_DICE_CODE' });
    return result$;
  }

  worker_res_as_observable() {
    if (!this.worker) {
      throw new Error('Should not happen');
    }
    this.currentWorkerStatus = WorkerStatus.BUSY;
    return new Observable((subscriber) => {
      this.worker!.onmessage = ({ data }) => {
        if (data.error) {
          subscriber.error(data.error);
          this.currentWorkerStatus = WorkerStatus.IDLE;
        } else {
          subscriber.next(data);
          subscriber.complete();
          this.currentWorkerStatus = WorkerStatus.IDLE;
        }
      };
    });
  }
}