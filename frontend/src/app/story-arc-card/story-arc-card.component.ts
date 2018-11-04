import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-story-arc-card',
  templateUrl: './story-arc-card.component.html',
  styleUrls: ['./story-arc-card.component.css']
})
export class StoryArcCardComponent {
  @Input('id') id:string;
  @Input('name') name:string;
  @Input('cover') cover:string;

  constructor() { }

  ngOnInit() {
    this.cover = encodeURIComponent(this.cover);
  }
}
