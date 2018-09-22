import { Component, OnInit, HostListener } from '@angular/core';
import { RestService } from '../rest.service';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css'],
  animations: [
    trigger('toolbarState', [
      state('hide', style({opacity: 0})),
      state('show', style({opacity: 1})),
      transition('*=>hide', animate(150)),
      transition('*=>show', animate(150))
    ])
  ]
})
export class ReaderComponent implements OnInit {

  volume:any = null;
  issue:any = null;
  nextIssue:any = null;
  prevIssue:any = null;
  pages:any = null;
  curPageImg:any = null;
  curPageNum:any = 0;
  zoomPercent:string = '50%';
  toolbarState:string = 'hide';

  constructor(public rest:RestService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.issue = null;
        this.volume = null;
        this.nextIssue = null;
        this.prevIssue = null;
        this.pages = [];
        this.curPageImg = null;
        this.curPageNum = 0;
        this.toolbarState = 'hide';

        this.rest.getIssue(params['id']).subscribe((data: {}) => {
          this.issue = data[0];
          this.volume = this.issue.volume;
          this.nextIssue = this.issue.nextIssue;
          this.prevIssue = this.issue.prevIssue;
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
    );

  }

  goToPage(pageNo:number) {
    if (pageNo > this.pages.length-1) {
      pageNo = this.pages.length-1;
    } else if (pageNo < 0) {
      pageNo = 0;
    }

    this.curPageNum = pageNo;
    this.curPageImg = this.pages[this.curPageNum];

    window.scrollTo(null, 0);
  }

  nextPage() {
    this.goToPage(this.curPageNum+1);
  }

  prevPage() {
    this.goToPage(this.curPageNum-1);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    //Left and right arrow keys
    if (event.keyCode === 37) {
      this.prevPage();
    } else if (event.keyCode === 39) {
      this.nextPage();
    }
  }

  onZoomChange(event) {
    this.zoomPercent = event.value.toString() + '%';
  }

  formatZoomLabel(value: number | null) {
      return value + '%';
  }

  onPageChange(event) {
    this.goToPage(event.value-1);
  }

  toggleToolbar() {
    this.toolbarState = this.toolbarState === 'hide' ? 'show' : 'hide';
  }

}
