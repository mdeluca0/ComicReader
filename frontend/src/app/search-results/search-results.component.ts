import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { RestService } from "../rest.service";

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {

  volumes:any = [];
  issues:any = [];
  breadcrumbs:any = [];
  search:string = "";

  constructor(public rest:RestService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.breadcrumbs.push(
      {icon: 'home', link: '/'}
    );

    this.route.queryParams.subscribe(
      params => {
        this.volumes = null;
        this.issues = null;
        this.search = params['search_query'].toString();

        this.rest.getSearch(params['search_query']).subscribe((data: {}) => {
          if (data['volumes']) {
            this.volumes = data['volumes'];
          }
          if (data['issues']) {
            this.issues = data['issues'];
          }
        }
      );
    });
  }

}
