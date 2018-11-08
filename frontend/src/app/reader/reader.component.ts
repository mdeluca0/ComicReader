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
  curPageNum:any = 0;
  zoomPercent:string = '50%';
  toolbarState:string = 'hide';
  pageForwardLoad:number = 1;
  pageBackwardLoad:number = 1;

  constructor(public rest:RestService,
              private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.issue = null;
        this.volume = null;
        this.nextIssue = null;
        this.prevIssue = null;
        this.pages = [];
        this.curPageNum = 0;
        this.toolbarState = 'hide';

        this.rest.getIssue(params['id']).subscribe((data: {}) => {
          this.issue = data;
          this.volume = this.issue.volume;
          this.nextIssue = this.issue.next;
          this.prevIssue = this.issue.previous;
          this.rest.getPageCount(params['id']).subscribe((data: {}) => {
            this.pages = new Array<number>(parseInt(data['page_count']));
            this.goToPage(this.curPageNum);
          });
        });
      }
    );
  }

  getPage(pageNo) {
    this.rest.getPage(this.issue._id, pageNo).subscribe((data: {pageNo, image}) => {
      this.pages[parseInt(data.pageNo)] = 'data:image/jpg;base64,' + data.image;
    });
  }

  goToPage(pageNo:number) {
    if (pageNo > this.pages.length-1) {
      this.router.navigate(['/reader/' + this.nextIssue._id]);
    } else if (pageNo < 0) {
      this.router.navigate(['/reader/' + this.prevIssue._id]);
    }

    if (this.curPageNum != pageNo) {
      window.scrollTo(null, 0);
    }

    this.curPageNum = pageNo;

    if (this.pages[pageNo] == null) {
      this.getPage(pageNo);
    }

    for (let i = this.curPageNum+1; i <= this.curPageNum+this.pageForwardLoad; i++) {
      if (i < this.pages.length && this.pages[i] == null) {
        this.getPage(i);
      }
    }
    for (let i = this.curPageNum-1; i >= this.curPageNum-this.pageBackwardLoad; i--) {
      if (i > 0 && this.pages[i] == null) {
        this.getPage(i);
      }
    }
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
