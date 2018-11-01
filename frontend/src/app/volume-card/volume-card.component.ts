import {Component, Input } from '@angular/core';

@Component({
  selector: 'app-volume-card',
  templateUrl: './volume-card.component.html',
  styleUrls: ['./volume-card.component.css']
})
export class VolumeCardComponent {
  @Input('_id') _id:string;
  @Input('name') name:string;
  @Input('start_year') start_year:string;
  @Input('cover') cover:string;

  constructor() { }

}
