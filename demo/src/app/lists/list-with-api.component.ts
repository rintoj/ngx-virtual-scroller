import { ChangeEvent, VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Component, ViewChild } from '@angular/core';
import { Input } from '@angular/core';
import { ListItem, ListItemComponent } from './list-item.component';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';

@Component({
  selector: 'list-with-api',
  template: `
    <button (click)="sortByName()">Sort By Name</button>
    <button (click)="sortByIndex()">Sort By Index</button>
    <button (click)="randomHeight = !randomHeight">Toggle Random Height</button>
    <button *ngIf="randomHeight" (click)="ListItemComponent.ResetSeed();">Re-Randomize Item Sizes</button>
    <button *ngIf="randomHeight" (click)="scroll.invalidateAllCachedMeasurements();">Invalidate cached measurements</button>

    <div class="status">
        Showing <span>{{scroll.viewPortInfo.startIndex}}</span>
        - <span>{{scroll.viewPortInfo.endIndex}}</span>
        of <span>{{items?.length}}</span>
      <span>({{scroll.viewPortItems?.length}} nodes)</span>
      <span>[scrollStartPosition: {{scroll.viewPortInfo.scrollStartPosition}}px, scrollEndPosition: {{scroll.viewPortInfo.scrollEndPosition}}px, maxScrollPosition: {{scroll.viewPortInfo.maxScrollPosition}}px ]</span>
    </div>

    <virtual-scroller #scroll
      [enableUnequalChildrenSizes]="randomHeight"
      [items]="buffer"
      (end)="fetchMore($event)">

      <list-item [randomHeight]="randomHeight" *ngFor="let item of scroll.viewPortItems" [item]="item"> </list-item>
      <div *ngIf="loading" class="loader">Loading...</div>

    </virtual-scroller>
  `,
  styleUrls: ['./list-with-api.scss']
})
export class ListWithApiComponent implements OnChanges {
  @Input()
  public items: ListItem[];

  public ListItemComponent = ListItemComponent;
  public randomHeight = false;
  public buffer: ListItem[] = [];
  public readonly bufferSize: number = 10;
  public timer;
  public loading: boolean = false;

  public ngOnChanges(changes: SimpleChanges) {
    this.reset();
  }

  private reset() {
    this.fetchNextChunk(0, this.bufferSize);
  }

  public fetchMore(event: ChangeEvent) {
    if (event.end === this.buffer.length - 1) {
      this.fetchNextChunk(this.buffer.length, this.bufferSize);
    }
  }

  private fetchNextChunk(skip: number, limit: number): void {
    this.loading = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.loading = false;

	  if (skip >= this.items.length) {
	    return;
	  }
	
      this.buffer = (this.buffer || []).concat(this.items.slice(skip, skip + limit));
    }, 1000 + Math.random() * 1000);
  }

  public sortByName() {
    this.buffer = [].concat(this.buffer || []).sort((a, b) => -(a.name < b.name) || +(a.name !== b.name));
  }

  public sortByIndex() {
    this.buffer = [].concat(this.buffer || []).sort((a, b) => -(a.index < b.index) || +(a.index !== b.index));
  }
}
