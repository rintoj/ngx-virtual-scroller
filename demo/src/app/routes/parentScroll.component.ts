import { Component, ViewChild } from '@angular/core';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';
import { Http } from '@angular/http';
import { ListItem } from '../lists/list-item.component';
import { OnInit } from '@angular/core';

@Component({
  selector: 'parent-scroll',
  template: `

<h1>Window/Parent Scroll</h1>
<button (click)="sortByName()">Sort By Name</button>
<button (click)="sortByIndex()">Sort By Index</button>
<button (click)="reduceListToEmpty()">Reduce to 0 Items</button>
<button (click)="reduceList()">Reduce to 100 Items</button>
<button (click)="setToFullList()">Revert to 1000 Items</button>
<button (click)="scrollTo()">Scroll to 50</button>
<button (click)="randomHeight = !randomHeight">Toggle Random Height</button>

<div class="status">
  Showing <span class="badge">{{indices?.start}}</span>
  - <span class="badge">{{indices?.end}}</span>
  of <span class="badge">{{filteredList?.length}}</span>
  <span>({{scrollItems?.length}} nodes)</span>
</div>

<virtual-scroll #scroll [parentScroll]="scroll.window"
                [enableUnequalChildrenSizes]="randomHeight"
                [items]="filteredList"
                (update)="scrollItems = $event"
                (change)="indices = $event">

  <list-item [randomHeight]="randomHeight" *ngFor="let item of scrollItems" [item]="item"> </list-item>

</virtual-scroll>
        
    `
})
export class ParentScrollComponent implements OnInit {

  randomHeight = false;

  items: ListItem[];
  scrollItems: ListItem[];
  indices: any;

  filteredList: ListItem[];

  @ViewChild(VirtualScrollComponent)
  private virtualScroll: VirtualScrollComponent;

  reduceListToEmpty() {
    this.filteredList = [];
  }

  reduceList() {
    this.filteredList = (this.items || []).slice(0, 100);
  }

  sortByName() {
    this.filteredList = [].concat(this.filteredList || []).sort((a, b) => -(a.name < b.name) || +(a.name !== b.name));
  }

  sortByIndex() {
    this.filteredList = [].concat(this.filteredList || []).sort((a, b) => -(a.index < b.index) || +(a.index !== b.index));
  }

  setToFullList() {
    this.filteredList = (this.items || []).slice();
  }

  scrollTo() {
    this.virtualScroll.scrollToIndex(50);
  }

  constructor(private http: Http) { }

  ngOnInit() {
    this.http.get('assets/data/items.json')
      .map(response => response.json())
      .subscribe(data => {
        this.items = data;
        this.setToFullList();
      });
  }
}
