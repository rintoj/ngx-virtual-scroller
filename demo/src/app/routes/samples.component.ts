import { Component } from '@angular/core';
import { ListItem } from '../lists/list-item.component';
import { BaseList } from '../lists/base-list';

@Component({
  selector: 'samples',
  templateUrl: 'samples.component.html'
})
export class SamplesComponent {

  public items: ListItem[] = [];

  constructor() {
	this.items = BaseList.generateMultipleRandomItems(10000);	  
  }
}
