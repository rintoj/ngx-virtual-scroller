import { Http } from '@angular/http';
import { ListItem } from './lists/list-item.component';
import { OnInit, ViewEncapsulation, Component } from '@angular/core';

@Component({
    selector: 'app-root',
    template: `
        <h2>Vertical Scroll with One Column</h2>
        <vertical-list [items]="items"></vertical-list>

        <h2>Vertical Scroll with Multiple Column</h2>
        <multi-col-list [items]="items"></multi-col-list>

        <h2>Horizontal Scroll</h2>
        Coming soon....
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
            .subscribe(data => this.items = data.slice(0, 1000));
    }
}
