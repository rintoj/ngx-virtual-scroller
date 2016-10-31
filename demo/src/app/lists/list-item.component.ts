import { Component, Input } from '@angular/core';

export interface ListItem {
    index?: number;
    name?: string;
    gender?: string;
    age?: number;
    email?: string;
    phone?: string;
    address?: string;
}

@Component({
    selector: 'list-item',
    template: `
        <div class="avatar">{{item.index}}</div>
        <div class="item-content">
            <div class="name">{{item.name}}</div>
            <div>
                <span class="badge">{{item.age}}/{{item.gender?.substr(0, 1).toUpperCase()}}</span>
                <span>{{item.email}} | {{item.phone}}</span>
            </div>
            <div>{{item.address}}</div>
        </div>
    `,
    styleUrls: ['./list-item.scss']
})
export class ListItemComponent {
    @Input()
    item: ListItem;
}