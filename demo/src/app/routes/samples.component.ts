import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { ListItem } from '../lists/list-item.component';
import { OnInit } from '@angular/core';

@Component({
  selector: 'samples',
  templateUrl: 'samples.component.html'
})
export class SamplesComponent implements OnInit {

  items: ListItem[];

  constructor(private http: Http) { }

  ngOnInit() {
    this.http.get('assets/data/items.json')
      .map(response => response.json())
      .subscribe(data => this.items = data);
  }
}
