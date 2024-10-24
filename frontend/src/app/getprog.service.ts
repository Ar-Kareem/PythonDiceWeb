import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GetprogService {

  constructor(private http: HttpClient) { }

  getprog(id: number) {
    const url = `http://anydice.com/program/${id}`;
    throw new Error('Not implemented');
    return this.http.get(url);
  }
}
