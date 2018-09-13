import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const endpoint = 'http://localhost:8000/';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  constructor(private http: HttpClient) {}

  private extractData(res: Response) {
    let body = res;
    return body || { };
  }

  getVolumes(): Observable<any> {
    return this.http.get(endpoint + 'volumes').pipe(map(this.extractData));
  }

  getVolume(id): Observable<any> {
    return this.http.get(endpoint + 'volumes/' + id).pipe(map(this.extractData));
  }

  getIssuesByVolume(id): Observable<any> {
    return this.http.get(endpoint + 'volumes/' + id + '/issues').pipe(map(this.extractData));
  }

  getIssue(id): Observable<any> {
    return this.http.get(endpoint + 'issues/' + id).pipe(map(this.extractData));
  }
}
