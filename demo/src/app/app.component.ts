import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { ListItem } from './lists/list-item.component';
import { OnInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
        <h2>With <span>Single Column</span></h2>
        <vertical-list [items]="items"></vertical-list>

        <h2>With <span>Multiple Columns</span></h2>
        <multi-col-list [items]="items"></multi-col-list>

        <h2>With <span>Table</span></h2>
        <table-list [items]="items"></table-list>

        <h2>Loading in <span>Chunks</span></h2>
        <list-with-api [items]="items"></list-with-api>
        <p><strong>change</strong> event is fired every time start or end index change.
        You could use this to load more items at the end of the scroll. See below.</p>
        <pre><code class="javascript">{{codeListWithApi}}</code></pre>
    `,
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  items: ListItem[];

  readonly codeListWithApi = `
        import { ChangeEvent } from 'angular2-virtual-scroll';
        ...

        @Component({
            selector: 'list-with-api',
            template: \`
                <virtual-scroll [items]="buffer" (update)="scrollItems = $event"
                    (change)="onListChange($event)">

                    <list-item *ngFor="let item of scrollItems" [item]="item"> </list-item>
                    <div *ngIf="loading" class="loader">Loading...</div>

                </virtual-scroll>
            \`
        })
        export class ListWithApiComponent implements OnChanges {

            @Input()
            items: ListItem[];

            buffer: ListItem[] = [];
            loading: boolean;

            onListChange(event: ChangeEvent) {
                if (event.end !== this.buffer.length) return;
                this.loading = true;
                this.fetchNextChunk(this.buffer.length, 10).then(chunk => {
                    this.buffer = this.buffer.concat(chunk);
                    this.loading = false;
                }, () => this.loading = false);
            }

            fetchNextChunk(skip: number, limit: number): Promise<ListItem[]> {
                return new Promise((resolve, reject) => {
                    ....
                });
            }
        }
    `.replace(/^        /mg, '');

  constructor(private http: Http) { }

  ngOnInit() {
    this.http.get('assets/data/items.json')
      .map(response => response.json())
      .subscribe(data => this.items = data);
  }
}
