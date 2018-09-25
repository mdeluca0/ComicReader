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
  breadcrumbs:any = [];

  constructor(public rest:RestService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.issue = null;
        this.nextIssue = null;
        this.prevIssue = null;
        this.volume = null;
        this.breadcrumbs = [];

        this.rest.getIssue(params['id']).subscribe((data: {}) => {
          this.issue = data[0];
          this.nextIssue = this.issue.nextIssue;
          this.prevIssue = this.issue.prevIssue;
          this.volume = this.issue.volume;

          //TODO: break out sub array filtering to it's own method
          this.issue.writer = "";
          this.issue.artist = "";
          for (let i = 0; i < this.issue.person_credits.person.length; i++) {
            if (this.issue.person_credits.person[i].role.toLowerCase().includes('writer')) {
              this.issue.writer += this.issue.person_credits.person[i].name + ', ';
            }
            if (this.issue.person_credits.person[i].role.toLowerCase().includes('artist') ||
              this.issue.person_credits.person[i].role.toLowerCase().includes('penciler')) {
              this.issue.artist += this.issue.person_credits.person[i].name + ', ';
            }
          }
          this.issue.writer = this.issue.writer.slice(0, -2);
          this.issue.artist = this.issue.artist.slice(0, -2);

          this.breadcrumbs = [
            {icon: 'home', link: '/'},
            {name: this.volume.name, link: '/volumes/' + this.volume.id.toString()},
            {name: '#' + this.issue.issue_number.toString() + ' - ' + this.issue.name}
          ];

          /*this.issue.characters = "";
          for (let i = 0; i < this.issue.character_credits.character.length; i++) {
            this.issue.characters += this.issue.character_credits.character[i].name + ', ';
          }
          this.issue.characters = this.issue.characters.slice(0, -2);*/
        });
      }
    );
  }
}
