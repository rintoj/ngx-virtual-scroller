import { ChangeEvent, VirtualScrollComponent } from 'angular2-virtual-scroll';
import { Component, ViewChild } from '@angular/core';
import { Input } from '@angular/core';
import { ListItem } from './list-item.component';
import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';

@Component({
  selector: 'list-with-api',
  template: `
    <button (click)="sortByName()">Sort By Name</button>
    <button (click)="sortByIndex()">Sort By Index</button>
    <button (click)="randomHeight = !randomHeight">Toggle Random Height</button>

    <div class="status">
      Showing <span class="badge">{{indices?.start}}</span>
      - <span class="badge">{{indices?.end}}</span>
      of <span class="badge">{{buffer?.length}}</span>
      <span>({{scrollItems?.length}} nodes)</span>
    </div>

    <virtual-scroll
      [enableUnequalChildrenSizes]="randomHeight"
      [items]="buffer"
      (update)="scrollItems = $event"
      (end)="fetchMore($event)">

      <list-item [randomHeight]="randomHeight" *ngFor="let item of scrollItems" [item]="item"> </list-item>
      <div *ngIf="loading" class="loader">Loading...</div>

    </virtual-scroll>
  `,
  styleUrls: ['./list-with-api.scss']
})
export class ListWithApiComponent implements OnChanges {

  randomHeight = false;

  @Input()
  items: ListItem[];
  scrollItems: ListItem[];

  indices: ChangeEvent;
  buffer: ListItem[] = [];
  readonly bufferSize: number = 10;
  timer;
  loading: boolean;
  
  @ViewChild(VirtualScrollComponent)
  private virtualScroll: VirtualScrollComponent;

  ngOnChanges(changes: SimpleChanges) {
    this.reset();
  }

  reset() {
    this.fetchNextChunk(0, this.bufferSize, {}).then(chunk => this.buffer = chunk);
  }

  fetchMore(event: ChangeEvent) {
    this.indices = event;
    if (event.end === this.buffer.length - 1) {
      this.loading = true;
      this.fetchNextChunk(this.buffer.length, this.bufferSize, event).then(chunk => {
        this.buffer = this.buffer.concat(chunk);
        this.loading = false;
      }, () => this.loading = false);
    }
  }

  fetchNextChunk(skip: number, limit: number, event?: any): Promise<ListItem[]> {
    return new Promise((resolve, reject) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (skip < this.items.length) {
          return resolve(this.items.slice(skip, skip + limit));
        }
        reject();
      }, 1000 + Math.random() * 1000);
    });
  }

  sortByName() {
    this.buffer = [].concat(this.buffer || []).sort((a, b) => -(a.name < b.name) || +(a.name !== b.name));
  }

  sortByIndex() {
    this.buffer = [].concat(this.buffer || []).sort((a, b) => -(a.index < b.index) || +(a.index !== b.index));
  }

  scrollTo() {
    this.virtualScroll.scrollToIndex(50);
  }
}
