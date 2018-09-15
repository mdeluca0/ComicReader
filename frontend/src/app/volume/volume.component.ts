import { Component, OnInit } from '@angular/core';
import { RestService } from '../rest.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-volume',
  templateUrl: './volume.component.html',
  styleUrls: ['./volume.component.css']
})
export class VolumeComponent implements OnInit {

  volume:any;
  issues:any = [];

  constructor(public rest:RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.rest.getVolume(this.route.snapshot.params['id']).subscribe((data: {}) => {
      console.log(data);
      this.volume = data[0];
    });
    this.rest.getIssuesByVolume(this.route.snapshot.params['id']).subscribe((data: {}) => {
      console.log(data);
      this.issues = data;
    });
  }
}
