
import { HttpContextToken, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToastActions } from './toast/toast.reducer';


export const API_BLOCKS_UI = new HttpContextToken<boolean>(() => false);

@Injectable()
export class loadInterceptor implements HttpInterceptor {
  constructor(private store: Store) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const block_ui = req.context.get(API_BLOCKS_UI) === true
    if (block_ui) {
      this.store.dispatch(ToastActions.addLoadingRequest());
    }
    return next.handle(req).pipe(tap(event => {
      if (event.type === HttpEventType.Response) {
        if (block_ui) {
          this.store.dispatch(ToastActions.removeLoadingRequest());
        }
      }
    }));
  }
}
