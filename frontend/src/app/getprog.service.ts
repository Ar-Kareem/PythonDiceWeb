import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GetprogService {

  constructor(private http: HttpClient) { }

  getprog(id: number|string) {
    const url = `https://pydiceapi.abdulrahman-kareem.com/get_prog`;
    return this.http.post(url, {key: id});
  }

  saveprog(prog: string) {
    const url = `https://pydiceapi.abdulrahman-kareem.com/save_prog`;
    return this.http.post(url, {prog: prog});
  }
}
