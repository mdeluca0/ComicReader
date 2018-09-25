import {Component, Input } from '@angular/core';

@Component({
  selector: 'app-volume-card',
  templateUrl: './volume-card.component.html',
  styleUrls: ['./volume-card.component.css']
})
export class VolumeCardComponent {

  @Input('volume') volume:{};

  constructor() { }

}
