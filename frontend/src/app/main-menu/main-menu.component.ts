import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent {

  @Input('breadcrumbs') breadcrumbs:Array<{}>;
  searchValue:string = "";

  constructor(private router: Router) { }

  submitSearch() {
    if (this.searchValue.length > 0) {
      this.router.navigate(['/results'], { queryParams: { search: this.searchValue }});
      this.searchValue = "";
    }
  }
}
