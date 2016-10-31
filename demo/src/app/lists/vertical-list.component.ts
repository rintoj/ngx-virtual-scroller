import { ListItem } from './list-item.component';
import { Input, Component } from '@angular/core';

@Component({
    selector: 'vertical-list',
    template: `
        <div class="status">
             Showing <span class="badge">{{indices?.start + 1}}</span>
             - <span class="badge">{{indices?.end}}</span>
             of <span class="badge">{{items?.length}}</span>
            <span>({{scrollItems?.length}} nodes)</span>
            </div>

        <virtual-scroll
            [items]="items"
            (update)="scrollItems = $event"
            (indexUpdate)="indices = $event">

            <list-item *ngFor="let item of scrollItems" [item]="item"> </list-item>

        </virtual-scroll>
    `
})
export class VerticalListComponent {

    @Input()
    items: ListItem[];

    indices: any;
}