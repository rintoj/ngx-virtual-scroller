import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';
import { ListItem } from './list-item.component';

@Component({
  selector: 'table-list',
  template: `
    <button (click)="sortByName()">Sort By Name</button>
    <button (click)="sortByIndex()">Sort By Index</button>
    <button (click)="reduceListToEmpty()">Reduce to 0 Items</button>
    <button (click)="reduceList()">Reduce to 100 Items</button>
    <button (click)="setToFullList()">Revert to 1000 Items</button>
    <button (click)="scroll.scrollToIndex(50)">Scroll to index 50</button>
    <button (click)="scroll.scrollToPosition(1500)">Scroll to position 1500</button>

    <div class="status">
        Showing <span>{{scroll.viewPortInfo.startIndex}}</span>
        - <span>{{scroll.viewPortInfo.endIndex}}</span>
        of <span>{{filteredList?.length}}</span>
      <span>({{scroll.viewPortItems?.length}} nodes)</span>
      <span>[scrollStartPosition: {{scroll.viewPortInfo.scrollStartPosition}}px, scrollEndPosition: {{scroll.viewPortInfo.scrollEndPosition}}px, maxScrollPosition: {{scroll.viewPortInfo.maxScrollPosition}}px ]</span>
    </div>

    <virtual-scroll #scroll
      [items]="filteredList">
      <table>
		<thead>
			<th>Index</th>
			<th>Name</th>
			<th>Gender</th>
			<th>Age</th>
			<th>Address</th>
		</thead>
		<tbody #container>
			<tr *ngFor="let item of scroll.viewPortItems">
			  <td>{{item.index}}</td>
			  <td>{{item.name}}</td>
			  <td>{{item.gender}}</td>
			  <td>{{item.age}}</td>
			  <td>{{item.address}}</td>
			</tr>
		  </tbody>
      </table>
    </virtual-scroll>
  `,

  styleUrls: ['./table-list.scss']
})
export class TableListComponent implements OnChanges {
  @Input()
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

  public ngOnChanges() {
    this.setToFullList();
  }

}
