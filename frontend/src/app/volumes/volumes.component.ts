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

  constructor(public rest: RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.getVolumes();
  }

  getVolumes() {
    this.volumes = [];
    this.rest.getVolumes().subscribe((data: {volumes}) => {
      this.volumes = data.volumes;
    });
  }
}
