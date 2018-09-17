import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RestService} from "../rest.service";

@Component({
  selector: 'app-issue',
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.css']
})
export class IssueComponent implements OnInit {

  issue:any = null;
  volume:any = null;

  constructor(public rest:RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.rest.getIssue(this.route.snapshot.params['id']).subscribe((data: {}) => {
      this.issue = data[0];

      this.volume = this.issue.volume;

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

      /*this.issue.characters = "";
      for (let i = 0; i < this.issue.character_credits.character.length; i++) {
        this.issue.characters += this.issue.character_credits.character[i].name + ', ';
      }
      this.issue.characters = this.issue.characters.slice(0, -2);*/
    });
  }

}
