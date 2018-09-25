import { Component, OnInit } from '@angular/core';
import { RestService } from '../rest.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-volumes',
  templateUrl: './volumes.component.html',
  styleUrls: ['./volumes.component.css']
})
export class VolumesComponent implements OnInit {
  volumes:any = [];

  breadcrumbs:any = [];

  offset:number = 0;
  finished:boolean = false;
  requesting:boolean = false;

  constructor(public rest: RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.breadcrumbs.push(
      {icon: 'home', link: '/'}
    );

    this.getVolumes();
  }

  getVolumes() {
    if (!this.requesting) {
      this.requesting = true;
      this.rest.getVolumes(this.offset).subscribe((data: { volumes }) => {
        if (data.volumes.length === 0) {
          this.finished = true;
        }

        this.offset += data.volumes.length;

        for (let i = 0; i < data.volumes.length; i++) {
          this.volumes.push(data.volumes[i]);
        }

        this.requesting = false;
      });
    }
  }

  onScroll() {
    if (!this.finished && window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      this.getVolumes();
    }
  }
}
