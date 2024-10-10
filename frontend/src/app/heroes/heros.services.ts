import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class HerosService {
  constructor(private http: HttpClient) {}

  postCode(code: string): Observable<any> {
    return this.http.post('/api/ParseExec', { code }).pipe(
      map((response: any) => response),
    );
  }

}