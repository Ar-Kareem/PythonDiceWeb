import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';

import { API_BLOCKS_UI } from './http-interceptor';
import { EXAMPLE_PROGS } from './example-progs';

const FIRST_PROG_KEY = 10000;

@Injectable({
  providedIn: 'root'
})
export class GetprogService {

  constructor(private http: HttpClient) { }

  getprog(id: number|string) {
    if (!isNumber(id)) {
      return of({"error":"key must be an integer","resp":"error"})
    }
    id = parseInt(id as string);
    if (id < FIRST_PROG_KEY) {
      const exampleProg = EXAMPLE_PROGS[id];  // search in docs
      if (!!exampleProg) {
        return of({prog: exampleProg.prog, name: exampleProg.name, 'resp': 'success'});
      }
      return of({"error":"key not found","resp":"error"})
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
