import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { Http } from '@angular/http';
import { ListItem } from './lists/list-item.component';

@Component({
    selector: 'app-root',
    template: `
        <h2>With <span>Single Column</span></h2>
        <vertical-list [items]="items"></vertical-list>

        <h2>With <span>Multiple Columns</span></h2>
        <multi-col-list [items]="items"></multi-col-list>
    `,
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

    protected items: ListItem[];

    constructor(private http: Http) { }

    ngOnInit() {
        this.http.get('assets/data/items.json')
            .map(response => response.json())
            .subscribe(data => this.items = data);
    }
}
