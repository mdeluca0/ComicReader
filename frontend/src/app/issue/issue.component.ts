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
  name:string = "";
  coverDate:string = "";
  description:string = "";
  cover:string = "";
  pageCount:any = null;
  storyArcId:string = "";
  storyArcName:string = "";
  writer:string = "";
  artist:string = "";
  breadcrumbs:any = [];

  constructor(public rest:RestService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.issue = null;
        this.nextIssue = null;
        this.prevIssue = null;
        this.volume = null;

        this.rest.getIssue(params['id']).subscribe((data: {}) => {
          this.issue = data[0];
          this.nextIssue = this.issue.nextIssue;
          this.prevIssue = this.issue.prevIssue;
          this.volume = this.issue.volume;

          this.rest.getPageCount(params['id']).subscribe((data: {}) => {
            this.pageCount = data['page_count'];
          });

          if (this.issue.metadata.volume.id && this.issue.metadata.cover) {
            this.cover = this.issue.metadata.volume.id + '/' + this.issue.metadata.cover;
          }

          if (this.issue.metadata.name) {
            this.name = this.issue.metadata.name;
          }

          if (this.issue.metadata.cover_date) {
            this.coverDate = this.issue.metadata.cover_date;
          }

          if (this.issue.metadata.description) {
            this.description = this.issue.metadata.description;
          }

          if (this.issue.metadata.story_arc_credits.story_arc) {
            this.storyArcId = this.issue.metadata.story_arc_credits.story_arc.id || null;
            this.storyArcName = this.issue.metadata.story_arc_credits.story_arc.name || null;
          }

          if (this.issue.metadata.person_credits) {
            this.writer = IssueComponent.getPeopleByRole(this.issue.metadata.person_credits.person, 'writer');
            this.artist = IssueComponent.getPeopleByRole(this.issue.metadata.person_credits.person, 'artist|penciler');
          }

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
