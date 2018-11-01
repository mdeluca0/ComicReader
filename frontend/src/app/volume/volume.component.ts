import { Component, OnInit } from '@angular/core';
import { RestService } from '../rest.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-volume',
  templateUrl: './volume.component.html',
  styleUrls: ['./volume.component.css']
})
export class VolumeComponent implements OnInit {
  volume:any = null;
  issues:any = [];

  cover:string = "";
  name:string = "";
  start_year:string = "";
  publisher:string = "";
  description:string = "";
  issueCount:string = "";

  breadcrumbs:any = [];

  offset:number = 0;
  finished:boolean = false;
  requesting:boolean = false;

  constructor(public rest:RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.rest.getVolume(this.route.snapshot.params['id']).subscribe((data: {}) => {
      this.volume = data[0];

      this.cover = (this.volume.metadata.id + '/' + this.volume.metadata.cover) || '';
      this.name = this.volume.name;
      this.start_year = this.volume.start_year;
      this.publisher = this.volume.metadata.publisher.name || '';
      this.description = this.volume.metadata.description || '';
      this.issueCount = this.volume.metadata.count_of_issues || '';

      this.breadcrumbs.push(
        {icon: 'home', link: '/'},
        {name: this.volume.name}
      );

      this.getIssues();
    });
  }

  getIssues() {
    if (!this.requesting) {
      this.requesting = true;
      this.rest.getIssuesByVolume(this.route.snapshot.params['id'], this.offset).subscribe((data: { issues }) => {
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
