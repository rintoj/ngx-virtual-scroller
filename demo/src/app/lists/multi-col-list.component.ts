import { Component, Input, OnChanges } from '@angular/core';

import { ListItem } from './list-item.component';

@Component({
  selector: 'multi-col-list',
  template: `

        <button (click)="reduceList()">Reduce to 100 Items</button>
        <button (click)="setToFullList()">Revert to 1000 Items</button>

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
    `,
  styleUrls: ['./multi-col-list.scss']
})
export class MultiColListComponent implements OnChanges {

  @Input()
  items: ListItem[];

  indices: any;

  filteredList: ListItem[];

  reduceList() {
    this.filteredList = (this.items || []).slice(0, 100);
  }

  setToFullList() {
    this.filteredList = (this.items || []).slice();
  }

  ngOnChanges() {
    this.setToFullList();
  }
}