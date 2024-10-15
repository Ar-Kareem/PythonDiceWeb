import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CodeApiActions } from './heros.reducer';


// EFFECTS

@Injectable()
export class HerosEffects {

  execDiceCode$ = createEffect(() => 
    this.actions$.pipe(
    ofType(CodeApiActions.execDiceCodeRequest),
    switchMap(action => this.herosService.postCode(action.code)
      .pipe(
        map(response => CodeApiActions.execDiceCodeSuccess({ response })),
        catchError((response) => of(CodeApiActions.execDiceCodeFailure({ error: {response: response, inp_code: action.code} })))
      ))
    )
  );

  execPythonCode$ = createEffect(() => 
    this.actions$.pipe(
    ofType(CodeApiActions.execPythonCodeRequest),
    switchMap(action => this.herosService.postPythonCode(action.code)
      .pipe(
        map(response => CodeApiActions.execPythonCodeSuccess({ response })),
        catchError((response) => of(CodeApiActions.execPythonCodeFailure({ error: {response: response, inp_code: action.code} })))
      ))
    )
  );

  translateDiceCode$ = createEffect(() => 
    this.actions$.pipe(
    ofType(CodeApiActions.translateDiceCodeRequest),
    switchMap(action => this.herosService.postTranslateCode(action.code)
      .pipe(
        map(response => CodeApiActions.translateDiceCodeRespone({ response, inp_code: action.code, err: false })),
        catchError((response) => of(CodeApiActions.translateDiceCodeRespone({ response, inp_code: action.code, err: true })))
      ))
    ));

  constructor(
    private actions$: Actions,
    private herosService: HerosService,
  ) {}
}


// SERVICE
function myStreamHandler(source: Observable<string>) {
  return source.pipe(
    map((response: string) => JSON.parse(response.trim())),
    map((response: any) => {
      if (!!response.is_error) {
        throw response;
      }
      return response;
    })
  );
}

@Injectable({ providedIn: 'root' })
export class HerosService {
  constructor(private http: HttpClient) {}

  postCode(code: string): Observable<any> {
    return this.http.post('/api/ParseExec', { code }, {responseType: 'text', }).pipe(
      myStreamHandler,
      map((response: any) => {
        if (!response || !response.result || response.result.trim() == '') {
          response.payload = 'No output found. Did you forget to call "output"?';
          response.message = 'CUSTOM';
          throw response
        }
        return response
      }),
    );
  }

  postPythonCode(code: string): Observable<any> {
    return this.http.post('/api/ExecPython', { code }, {responseType: 'text', }).pipe(
      myStreamHandler,
      map((response: any) => {
        if (!response || !response.result || response.result.trim() == '') {
          response.payload = 'No output found. Did you forget to call "output"?';
          response.message = 'CUSTOM';
          throw response
        }
        return response
      }),
    );
  }

  postTranslateCode(code: string): Observable<any> {
    return this.http.post('/api/Translate', { code }, {responseType: 'text', }).pipe(
      myStreamHandler,
      map((response: any) => response),
    );
  }
}
