import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';

import { API_BLOCKS_UI } from './http-interceptor';

@Injectable({
  providedIn: 'root'
})
export class GetprogService {

  constructor(private http: HttpClient) { }

  getprog(id: number|string) {
    if (!isNumber(id)) {
      return of({"error":"key must be an integer","resp":"error"})
    }
    const url = `https://pydiceapi.abdulrahman-kareem.com/get_prog`;
    return this.http.post(url, {key: id}, {
      context: new HttpContext().set(API_BLOCKS_UI, true),
    });
  }

  saveprog(prog: string) {
    const url = `https://pydiceapi.abdulrahman-kareem.com/save_prog`;
    return this.http.post(url, {prog: prog}, {
      context: new HttpContext().set(API_BLOCKS_UI, true),
    });
  }
}

function isNumber(n: number|string) {  // https://stackoverflow.com/a/27285032/6173665
  // @ts-ignore
  return !isNaN(parseFloat(n)) && isFinite(n);
}
