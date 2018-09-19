import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { ListItem, ListItemComponent } from './list-item.component';
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
    <button (click)="randomHeight = !randomHeight">Toggle Random Height</button>
    <button *ngIf="randomHeight" (click)="ListItemComponent.ResetSeed();">Re-Randomize Item Sizes</button>
    <button *ngIf="randomHeight" (click)="virtualScroll.invalidateAllCachedMeasurements();">Invalidate cached measurements</button>

    <div class="status">
        Showing <span class="badge">{{indices?.start}}</span>
        - <span class="badge">{{indices?.end}}</span>
        of <span class="badge">{{filteredList?.length}}</span>
      <span>({{scrollItems?.length}} nodes)</span>
      </div>

    <virtual-scroll
      [enableUnequalChildrenSizes]="randomHeight"
      [items]="filteredList"
      (update)="scrollItems = $event"
      (change)="indices = $event">
      
      <list-item [randomHeight]="randomHeight" *ngFor="let item of scrollItems" class="inline" [item]="item"> </list-item>
    </virtual-scroll>
  `,
  styleUrls: ['./multi-col-list.scss']
})
export class MultiColListComponent implements OnChanges {
  @Input()
  public items: ListItem[];

  @ViewChild(VirtualScrollComponent)
  public virtualScroll: VirtualScrollComponent;

  public ListItemComponent = ListItemComponent;
  public randomHeight = false;
  public scrollItems: ListItem[];
  public indices: any;
  public filteredList: ListItem[];

  public reduceListToEmpty() {
    this.filteredList = [];
  }

  public reduceList() {
    this.filteredList = (this.items || []).slice(0, 100);
  }

  public sortByName() {
    this.filteredList = [].concat(this.filteredList || []).sort((a, b) => -(a.name < b.name) || +(a.name !== b.name));
  }

  public sortByIndex() {
    this.filteredList = [].concat(this.filteredList || []).sort((a, b) => -(a.index < b.index) || +(a.index !== b.index));
  }

  public setToFullList() {
    this.filteredList = (this.items || []).slice();
  }

  public scrollTo() {
    this.virtualScroll.scrollToIndex(50);
  }

  public ngOnChanges() {
    this.setToFullList();
  }
}
