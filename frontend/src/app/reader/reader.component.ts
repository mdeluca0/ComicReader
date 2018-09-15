import { Component, OnInit } from '@angular/core';
import { RestService } from '../rest.service';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css'],
  animations: [
    trigger('pageState', [
      state('prev', style({transform: 'translateX(-100%) scale(1)'})),
      state('curr', style({transform: 'translateX(0) scale(1)'})),
      state('next', style({transform: 'translateX(100%) scale(1)'})),
      transition('prev => curr', [
        style({transform: 'translateX(0) scale(1)'}),
        animate(150)
      ]),
      transition('curr => next', [
        style({transform: 'translateX(100%) scale(1)'}),
        animate(150)
      ]),
      transition('curr => prev', [
        style({transform: 'translateX(-100%) scale(1)'}),
        animate(150)
      ]),
      transition('next => curr', [
        style({transform: 'translateX(0) scale(1)'}),
        animate(150)
      ])
    ])
  ]
})
export class ReaderComponent implements OnInit {

  issue:any = {};
  pages:any = [];

  curPageImg:any;
  curPageNum:any = 0;

  constructor(public rest:RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.rest.getIssue(this.route.snapshot.params['id']).subscribe((data: {}) => {
      this.issue = data[0];
      this.pages = new Array<number>(this.issue.page_count);

      for (let i = 0; i < this.issue.page_count; i++) {
        this.rest.getPage(this.issue.id, i).subscribe((data: {pageNo, image}) => {
          this.pages[parseInt(data.pageNo)] = 'data:image/jpg;base64,' + data.image;

          if (parseInt(data.pageNo) === this.curPageNum) {
            this.curPageImg = this.pages[this.curPageNum];
          }
        });
      }
    });
  }

  nextPage() {
    if (typeof(this.pages[this.curPageNum]) !== 'undefined') {
      this.curPageNum += 1;
      this.curPageImg = this.pages[this.curPageNum];
    }
  }

  prevPage() {
    if (typeof(this.pages[this.curPageNum]) !== 'undefined') {
      this.curPageNum -= 1;
      this.curPageImg = this.pages[this.curPageNum];
    }
  }

}
