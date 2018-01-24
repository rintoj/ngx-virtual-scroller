import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';
import { ListItem } from './list-item.component';

@Component({
  selector: 'vertical-list',
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

    <virtual-scroll
      [items]="filteredList"
      (update)="scrollItems = $event"
      (change)="indices = $event">

      <list-item *ngFor="let item of scrollItems" [item]="item"> </list-item>

    </virtual-scroll>
  `
})
export class VerticalListComponent implements OnChanges {

  @Input()
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
    this.virtualScroll.scrollInto(this.items[50]);
  }

  ngOnChanges() {
    this.setToFullList();
  }

}
