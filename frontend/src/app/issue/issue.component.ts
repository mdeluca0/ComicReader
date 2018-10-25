import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { RestService } from "../rest.service";

@Component({
  selector: 'app-issue',
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.css']
})
export class IssueComponent implements OnInit {

  issue:any = null;
  nextIssue:any = null;
  prevIssue:any = null;
  volume:any = null;
  pageCount:any = null;
  breadcrumbs:any = [];

  constructor(public rest:RestService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.issue = null;
        this.nextIssue = null;
        this.prevIssue = null;
        this.volume = null;
        this.pageCount = '';
        this.breadcrumbs = [];

        this.rest.getIssue(params['id']).subscribe((data: {}) => {
          this.issue = data[0];
          this.nextIssue = this.issue.nextIssue;
          this.prevIssue = this.issue.prevIssue;
          this.volume = this.issue.volume;

          this.rest.getPageCount(params['id']).subscribe((data: {}) => {
            this.pageCount = data['page_count'];
          });

          this.issue.metadata.writer = IssueComponent.getPeopleByRole(this.issue.metadata.person_credits.person, 'writer');
          this.issue.metadata.artist = IssueComponent.getPeopleByRole(this.issue.metadata.person_credits.person, 'artist|penciler');

          this.breadcrumbs = [
            {icon: 'home', link: '/'},
            {name: this.volume.name, link: '/volumes/' + this.volume._id.toString()},
            {name: '#' + this.issue.issue_number.toString() + (' - ' + this.issue.metadata.name) || ''}
          ];

        });
      }
    );
  }

  static getPeopleByRole(people, role) {
    let result = [];
    for (let i = 0; i < people.length; i++) {
      if (people[i].role.toLowerCase().match(role)) {
        result.push(people[i].name);
      }
    }
    return result.join(', ');
  }
}
