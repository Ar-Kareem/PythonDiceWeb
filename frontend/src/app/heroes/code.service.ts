import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



// SERVICE
function myStreamHandler(source: Observable<string>) {
  return source.pipe(
    map((response: string) => JSON.parse(response.trim())),
    map((response: any) => {
      if (!!response.is_error) {
        throw response;
      }
      return response;
    })
  );
}

@Injectable({ providedIn: 'root' })
export class HerosService {
  constructor(private http: HttpClient) {}

  postCode(code: string): Observable<any> {
    return this.http.post('/api/ParseExec', { code }, {responseType: 'text', }).pipe(
      myStreamHandler,
      map((response: any) => {
        if (!response || !response.result || response.result.trim() == '') {
          response.payload = 'No output found. Did you forget to call "output"?';
          response.message = 'CUSTOM';
          throw response
        }
        return response
      }),
    );
  }

  postPythonCode(code: string): Observable<any> {
    return this.http.post('/api/ExecPython', { code }, {responseType: 'text', }).pipe(
      myStreamHandler,
      map((response: any) => {
        if (!response || !response.result || response.result.trim() == '') {
          response.payload = 'No output found. Did you forget to call "output"?';
          response.message = 'CUSTOM';
          throw response
        }
        return response
      }),
    );
  }

  postTranslateCode(code: string): Observable<any> {
    return this.http.post('/api/Translate', { code }, {responseType: 'text', }).pipe(
      myStreamHandler,
      map((response: any) => response),
    );
  }
}
