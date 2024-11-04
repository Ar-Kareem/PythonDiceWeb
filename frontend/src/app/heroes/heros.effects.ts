import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { CodeApiActions } from './heros.reducer';
import { HerosService } from './code.service';
import { PyodideService } from '../localbackend/local.service';
import { GetprogService } from '@app/getprog/getprog.service';

// EFFECTS

@Injectable()
export class HerosEffects {

  execDiceCode$ = createEffect(() => 
    this.actions$.pipe(
    ofType(CodeApiActions.execDiceCodeRequest),
        switchMap(action =>
          // this.herosService.postCode(action.code)
          this.pyodideService.exec_dice_code(action.code)
        .pipe(
        // tap((response) => console.log('response', response)),
        map(response => CodeApiActions.execDiceCodeSuccess({ response })),
        catchError((response) => of(CodeApiActions.execDiceCodeFailure({ error: {response: response, inp_code: action.code} })))
      ))
    )
  );

  execPythonCode$ = createEffect(() => 
    this.actions$.pipe(
    ofType(CodeApiActions.execPythonCodeRequest),
    switchMap(action => 
      // this.herosService.postPythonCode(action.code)
      this.pyodideService.exec_python_code(action.code)
      .pipe(
        map(response => CodeApiActions.execPythonCodeSuccess({ response })),
        catchError((response) => of(CodeApiActions.execPythonCodeFailure({ error: {response: response, inp_code: action.code} })))
      ))
    )
  );

  translateDiceCode$ = createEffect(() => 
    this.actions$.pipe(
    ofType(CodeApiActions.translateDiceCodeRequest),
    switchMap(action => 
      // this.herosService.postTranslateCode(action.code)
      this.pyodideService.translate_dice_code(action.code)
      .pipe(
        map(response => CodeApiActions.translateDiceCodeRespone({ response, inp_code: action.code, err: false })),
        catchError((response) => of(CodeApiActions.translateDiceCodeRespone({ response, inp_code: action.code, err: true })))
      ))
    ));
  
  getProgram$ = createEffect(() =>
    this.actions$.pipe(
    ofType(CodeApiActions.getProgramRequest),
    switchMap(action =>
      this.getprogService.getprog(action.id)
      .pipe(
        map((response: any) => {
          if (response?.resp == 'success') {
            return CodeApiActions.getProgramSuccess({ response })
          } else {
            return CodeApiActions.getProgramFailure({ error: response })
          }
        }),
        catchError((response) => of(CodeApiActions.getProgramFailure({ error: response }))
        )
      )
    ))
  );

  saveProgram$ = createEffect(() =>
    this.actions$.pipe(
    ofType(CodeApiActions.saveProgramRequest),
    switchMap(action =>
      this.getprogService.saveprog(action.prog)
      .pipe(
        map((response: any) => {
          if (response?.resp == 'success') {
            return CodeApiActions.saveProgramSuccess({ response })
          } else {
            return CodeApiActions.saveProgramFailure({ error: response })
          }
        }),
        catchError((response) => of(CodeApiActions.saveProgramFailure({ error: response }))
        )
      ))
    )
  );

  constructor(
    private actions$: Actions,
    private herosService: HerosService,
    private pyodideService: PyodideService,
    private getprogService: GetprogService,
  ) {}
}

