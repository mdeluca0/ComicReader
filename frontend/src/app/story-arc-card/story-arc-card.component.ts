import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-story-arc-card',
  templateUrl: './story-arc-card.component.html',
  styleUrls: ['./story-arc-card.component.css']
})
export class StoryArcCardComponent implements OnInit {
  @Input('id') id:string;
  @Input('name') name:string;
  @Input('cover') cover:string;

  constructor() { }

  ngOnInit() {
    if (this.cover != null) {
      this.cover = encodeURIComponent(this.cover);
    }
  }
}
