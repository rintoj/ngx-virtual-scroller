import { ChangeEvent, VirtualScrollComponent } from 'angular2-virtual-scroll';
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
    <button *ngIf="randomHeight" (click)="virtualScroll.invalidateAllCachedMeasurements();">Invalidate cached measurements</button>

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
  @Input()
  public items: ListItem[];

  @ViewChild(VirtualScrollComponent)
  public virtualScroll: VirtualScrollComponent;

  public ListItemComponent = ListItemComponent;
  public randomHeight = false;
  public scrollItems: ListItem[];
  public indices: ChangeEvent;
  public buffer: ListItem[] = [];
  public readonly bufferSize: number = 10;
  public timer;
  public loading: boolean;
  
  public ngOnChanges(changes: SimpleChanges) {
    this.reset();
  }

  private reset() {
    this.fetchNextChunk(0, this.bufferSize, {}).then(chunk => this.buffer = chunk);
  }

  public fetchMore(event: ChangeEvent) {
    this.indices = event;
    if (event.end === this.buffer.length - 1) {
      this.loading = true;
      this.fetchNextChunk(this.buffer.length, this.bufferSize, event).then(chunk => {
        this.buffer = this.buffer.concat(chunk);
        this.loading = false;
      }, () => this.loading = false);
    }
  }

  private fetchNextChunk(skip: number, limit: number, event?: any): Promise<ListItem[]> {
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

  public sortByName() {
    this.buffer = [].concat(this.buffer || []).sort((a, b) => -(a.name < b.name) || +(a.name !== b.name));
  }

  public sortByIndex() {
    this.buffer = [].concat(this.buffer || []).sort((a, b) => -(a.index < b.index) || +(a.index !== b.index));
  }

  public scrollTo() {
    this.virtualScroll.scrollToIndex(50);
  }
}
