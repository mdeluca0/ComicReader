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
    return res || { };
  }

  getVolumes(offset = 0): Observable<any> {
    return this.http.get(endpoint + 'volumes' + '?offset=' + offset.toString())
      .pipe(map(this.extractData));
  }

  getVolume(id): Observable<any> {
    return this.http.get(endpoint + 'volumes/' + <string>id)
      .pipe(map(this.extractData));
  }

  volumesSearch(query): Observable<any> {
    return this.http.get(endpoint + 'volumes/search?search=' + query.toString())
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

  issuesSearch(query): Observable<any> {
    return this.http.get(endpoint + 'issues/search?search=' + query.toString())
      .pipe(map(this.extractData));
  }

  getPageCount(id): Observable<any> {
    return this.http.get(endpoint + 'issues/' + <string>id + '/page_count')
      .pipe(map(this.extractData));
  }

  getPage(id, pageNo): Observable<any> {
    return this.http.get(endpoint + 'issues/' + <string>id + '/' + <string>pageNo)
      .pipe(map(this.extractData));
  }

  getStoryArc(id): Observable<any> {
    return this.http.get(endpoint + 'story_arcs/' + <string>id)
      .pipe(map(this.extractData));
  }

  getStoryArcIssues(id, offset = 0): Observable<any> {
    return this.http.get(endpoint + 'story_arcs/' + <string>id + '/issues' + '?offset=' + offset.toString())
      .pipe(map(this.extractData));
  }

  storyArcSearch(query): Observable<any> {
    return this.http.get(endpoint + 'story_arcs/search?search=' + query.toString())
      .pipe(map(this.extractData));
  }
}
