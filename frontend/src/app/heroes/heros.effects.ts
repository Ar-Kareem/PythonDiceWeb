import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { CodeApiActions } from './heros.reducer';
import { HerosService } from './code.service';


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

