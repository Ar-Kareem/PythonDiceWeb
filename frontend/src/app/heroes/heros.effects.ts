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

}