import { Component, Input, ViewEncapsulation } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-description-text',
  templateUrl: './description-text.component.html',
  styleUrls: ['./description-text.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('state', [
      state('collapsed', style({
        height: '38px',
        overflow: 'hidden'
      })),
      state('expanded', style( {
        height: 'auto',
        overflow: 'visible'
      })),
      transition('*=>collapsed', animate(250)),
      transition('*=>expanded', animate(250))
    ])
  ]
})
export class DescriptionTextComponent {

  state:string = 'collapsed';
  @Input('text') text:string;

  constructor() { }

  toggle() {
    this.state = this.state === 'collapsed' ? 'expanded' : 'collapsed';
  }
}
