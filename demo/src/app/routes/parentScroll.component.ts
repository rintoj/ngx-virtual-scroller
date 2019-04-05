import { map } from "rxjs/operators";
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Http } from '@angular/http';
import { ListItem, ListItemComponent } from '../lists/list-item.component';
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
<button (click)="scroll.scrollToIndex(50)">Scroll to index 50</button>
<button (click)="scroll.scrollToPosition(1500)">Scroll to position 1500</button>
<button (click)="randomHeight = !randomHeight">Toggle Random Height</button>
<button *ngIf="randomHeight" (click)="ListItemComponent.ResetSeed();">Re-Randomize Item Sizes</button>
<button *ngIf="randomHeight" (click)="scroll.invalidateAllCachedMeasurements();">Invalidate cached measurements</button>

    <div class="status">
        Showing <span>{{scroll.viewPortInfo.startIndex}}</span>
        - <span>{{scroll.viewPortInfo.endIndex}}</span>
        of <span>{{filteredList?.length}}</span>
      <span>({{scroll.viewPortItems?.length}} nodes)</span>
      <span>[scrollStartPosition: {{scroll.viewPortInfo.scrollStartPosition}}px, scrollEndPosition: {{scroll.viewPortInfo.scrollEndPosition}}px, maxScrollPosition: {{scroll.viewPortInfo.maxScrollPosition}}px ]</span>
    </div>

<virtual-scroller #scroll [parentScroll]="scroll.window"
                [enableUnequalChildrenSizes]="randomHeight"
                [items]="filteredList">

  <list-item [randomHeight]="randomHeight" *ngFor="let item of scroll.viewPortItems" [item]="item"> </list-item>

</virtual-scroller>
        
    `
})
export class ParentScrollComponent implements OnInit {

  public randomHeight = false;

  public items: ListItem[];

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

  constructor(private http: Http) { }

  public ngOnInit() {
    this.http.get('assets/data/items.json')
      .pipe(map(response => response.json()))
      .subscribe(data => {
        this.items = data;
        this.setToFullList();
      });
  }
}
