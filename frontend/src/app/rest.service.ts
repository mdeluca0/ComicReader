import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from "@angular/platform-browser"
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const endpoint = 'http://localhost:8000/';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  private extractData(res: Response) {
    let body = res;
    return body || { };
  }

  getVolumes(offset = 0): Observable<any> {
    return this.http.get(endpoint + 'volumes' + '?offset=' + offset.toString())
      .pipe(map(this.extractData));
  }

  getVolume(id): Observable<any> {
    return this.http.get(endpoint + 'volumes/' + <string>id)
      .pipe(map(this.extractData));
  }

  getIssuesByVolume(id, offset = 0): Observable<any> {
    return this.http.get(endpoint + 'volumes/' + <string>id + '/issues' + '?offset=' + offset.toString())
      .pipe(map(this.extractData));
  }

  getIssue(id): Observable<any> {
    return this.http.get(endpoint + 'issues/' + <string>id)
      .pipe(map(this.extractData));
  }

  getPage(id, pageNo): Observable<any> {
    return this.http.get(endpoint + 'issues/' + <string>id + '/' + <string>pageNo)
      .pipe(map(this.extractData));
  }

  getSearch(query): Observable<any> {
    return this.http.get(endpoint + 'results/' + '?search_query=' + query.toString())
      .pipe(map(this.extractData));
  }
}
