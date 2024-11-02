import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { API_BLOCKS_UI } from './http-interceptor';

@Injectable({
  providedIn: 'root'
})
export class GetprogService {

  constructor(private http: HttpClient) { }

  getprog(id: number|string) {
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
