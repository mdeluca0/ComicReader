import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent {

  @Input('breadcrumbs') breadcrumbs:Array<{}>;

  constructor() { }

}
