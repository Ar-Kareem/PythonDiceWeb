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

@Injectable({ providedIn: 'root' })
export class HerosService {
  constructor(private http: HttpClient) {}

  postCode(code: string): Observable<any> {
    return this.http.post('/api/ParseExec', { code }).pipe(
      map((response: any) => response),
    );
  }

  postPythonCode(code: string): Observable<any> {
    return this.http.post('/api/ExecPython', { code }).pipe(
      map((response: any) => response),
    );
  }

  postTranslateCode(code: string): Observable<any> {
    return this.http.post('/api/Translate', { code }).pipe(
      map((response: any) => response),
    );
  }
}