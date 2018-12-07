import { Component, OnInit } from '@angular/core';
import {RestService} from "../rest.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-story-arc',
  templateUrl: './story-arc.component.html',
  styleUrls: ['./story-arc.component.css']
})
export class StoryArcComponent implements OnInit {

  storyArc:any = null;
  issues:any = [];
  name:string = "";
  publisher:string = "";
  cover:string = "";
  deck:string = "";

  breadcrumbs:any = [];

  offset:number = 0;
  finished:boolean = false;
  requesting:boolean = false;

  constructor(public rest:RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.rest.getStoryArc(this.route.snapshot.params['id']).subscribe((data: { story_arcs }) => {
      this.storyArc = data.story_arcs[0];

      this.name = this.storyArc.name;
      this.publisher = this.storyArc.publisher.name;
      this.cover = this.storyArc.cover;
      this.deck = this.storyArc.deck;

      this.breadcrumbs.push(
        {icon: 'home', link: '/'},
        {name: this.name}
      );

      this.getIssues();
    });
  }

  getIssues() {
    if (!this.requesting) {
      this.requesting = true;
      this.rest.getStoryArcIssues(this.route.snapshot.params['id'], this.offset).subscribe((data: { issues }) => {
        if (data.issues.length === 0) {
          this.finished = true;
        }
        this.offset += data.issues.length;
        for (let i = 0; i < data.issues.length; i++) {
          this.issues.push(data.issues[i]);
        }
        this.requesting = false;
      });
    }
  }

  onScroll() {
    if (!this.finished && window.innerHeight + window.scrollY >= document.body.offsetHeight * 0.95) {
      this.getIssues();
    }
  }

}
