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
  storyArcs:any = [];
  breadcrumbs:any = [];
  search:string = "";

  constructor(public rest:RestService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.breadcrumbs.push(
      {icon: 'home', link: '/'}
    );

    this.route.queryParams.subscribe(
      params => {
        this.volumes = [];
        this.issues = [];
        this.storyArcs = [];
        this.search = params['search'].toString();

        this.rest.volumesSearch(params['search']).subscribe((data: { volumes }) => {
          this.volumes = data.volumes;
        });
        this.rest.issuesSearch(params['search']).subscribe((data: { issues }) => {
          this.issues = data.issues;
        });
        this.rest.storyArcSearch(params['search']).subscribe((data: { story_arcs }) => {
          this.storyArcs = data.story_arcs;
        });
    });
  }
}
