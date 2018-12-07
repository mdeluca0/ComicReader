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
  name:string = '';
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

        this.rest.getIssue(params['id']).subscribe((data: { issues }) => {
          this.issue = data.issues[0];
          this.nextIssue = this.issue.next;
          this.prevIssue = this.issue.previous;
          this.volume = this.issue.volume;

          this.rest.getPageCount(params['id']).subscribe((data: {}) => {
            this.pageCount = data['page_count'];
          });

          if (this.issue.metadata && this.issue.metadata.story_arc_credits) {
            this.storyArcId = this.issue.metadata.story_arc_credits.story_arc.id || null;
            this.storyArcName = this.issue.metadata.story_arc_credits.story_arc.name || null;
          }

          if (this.issue.metadata && this.issue.metadata.person_credits) {
            this.writer = IssueComponent.getPeopleByRole(this.issue.metadata.person_credits.person, 'writer');
            this.artist = IssueComponent.getPeopleByRole(this.issue.metadata.person_credits.person, 'artist|penciler');
          }

          let breadCrumbName = this.issue.metadata != null && this.issue.metadata.name.length ? ' - ' + this.issue.metadata.name : '';
          this.breadcrumbs = [
            {icon: 'home', link: '/'},
            {name: this.volume.name, link: '/volumes/' + this.volume._id.toString()},
            {name: '#' + this.issue.issue_number.toString() + breadCrumbName}
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
