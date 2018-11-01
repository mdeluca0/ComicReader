import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-issue-card',
  templateUrl: './issue-card.component.html',
  styleUrls: ['./issue-card.component.css']
})
export class IssueCardComponent {
  @Input('_id') _id:string;
  @Input('issue_number') issue_number:string;
  @Input('name') name:string;
  @Input('cover') cover:string;

  constructor() { }
}
