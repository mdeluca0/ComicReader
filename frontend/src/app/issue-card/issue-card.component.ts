import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-issue-card',
  templateUrl: './issue-card.component.html',
  styleUrls: ['./issue-card.component.css']
})
export class IssueCardComponent {

  @Input('issue') issue:{
    _id:string,
    issue_number:string,
    metadata:{
      name:string,
      cover:string,
      volume:{
        name:string,
        id:string
      }
    }
  };

  constructor() { }
}
