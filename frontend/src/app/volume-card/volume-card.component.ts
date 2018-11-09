import {Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-volume-card',
  templateUrl: './volume-card.component.html',
  styleUrls: ['./volume-card.component.css']
})
export class VolumeCardComponent implements OnInit {
  @Input('_id') _id:string;
  @Input('name') name:string;
  @Input('start_year') start_year:string;
  @Input('cover') cover:string;

  constructor() { }

  ngOnInit() {
    if (this.cover != null) {
      this.cover = encodeURIComponent(this.cover);
    }
  }

}
