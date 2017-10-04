import { Component, Input, OnChanges, ViewChild } from '@angular/core';

import { ListItem } from './list-item.component';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';

@Component({
  selector: 'multi-col-list',
  template: `

    <button (click)="sortByName()">Sort By Name</button>
    <button (click)="sortByIndex()">Sort By Index</button>
    <button (click)="reduceListToEmpty()">Reduce to 0 Items</button>
    <button (click)="reduceList()">Reduce to 100 Items</button>
    <button (click)="setToFullList()">Revert to 1000 Items</button>
    <button (click)="scrollTo()">Scroll to 50</button>

    <div class="status">
        Showing <span class="badge">{{indices?.start + 1}}</span>
        - <span class="badge">{{indices?.end}}</span>
        of <span class="badge">{{filteredList?.length}}</span>
      <span>({{scrollItems?.length}} nodes)</span>
      </div>

    <div virtualScroll
      [items]="filteredList"
      (update)="scrollItems = $event"
      (change)="indices = $event">

      <list-item *ngFor="let item of scrollItems" [item]="item"> </list-item>

    </div>
  `,
  styleUrls: ['./multi-col-list.scss']
})
export class MultiColListComponent implements OnChanges {

  @Input()
  items: ListItem[];

  scrollItems: ListItem[];

  indices: any;

  filteredList: ListItem[];

  @ViewChild(VirtualScrollComponent)
  virtualScroll: VirtualScrollComponent;

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
    this.virtualScroll.scrollInto(this.items[50]);
  }

  ngOnChanges() {
    this.setToFullList();
  }
}
