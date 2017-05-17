
# angular2-virtual-scroll

Virtual Scroll displays a virtual, "infinite" list. Supports multi-column.

## About

This module displays a small subset of records just enough to fill the viewport and uses the same DOM elements as the user scrolls.
This method is effective because the number of DOM elements are always constant and tiny irrespective of the size of the list. Thus virtual scroll can display infinitely growing list of items in an efficient way.

* Angular 2 compatible module
* Supports multi-column
* Easy to use apis
* OpenSource and available in [GitHub](https://github.com/rintoj/angular2-virtual-scroll)

## Demo

[See Demo Here](http://rintoj.github.io/angular2-virtual-scroll)

## Usage

```html
<virtual-scroll [items]="items" (update)="viewPortItems = $event">

    <list-item *ngFor="let item of viewPortItems" [item]="item">
    </list-item>

</virtual-scroll>
```

alternatively

```html
<div virtualScroll [items]="items" (update)="viewPortItems = $event">

    <list-item *ngFor="let item of viewPortItems" [item]="item">
    </list-item>

</div>
```

## Get Started

**Step 1:** Install angular2-virtual-scroll

```sh
npm install angular2-virtual-scroll --save
```

**Step 2:** Import virtual scroll module into your app module

```ts
....
import { VirtualScrollModule } from 'angular2-virtual-scroll';

....

@NgModule({
    ...
    imports: [
        ....
        VirtualScrollModule
    ],
    ....
})
export class AppModule { }
```

**Step 3:** Wrap virtual-scroll tag around list items;

```ts
<virtual-scroll [items]="items" (update)="viewPortItems = $event">

    <list-item *ngFor="let item of viewPortItems" [item]="item">
    </list-item>

</virtual-scroll>
```

**Step 4:** Create 'list-item' component.

'list-item' must a custom angular2 component, outside of this library. A sample list item is give below or check the [demo app](https://github.com/rintoj/angular2-virtual-scroll/tree/master/demo) for [list-item.component.ts](https://github.com/rintoj/angular2-virtual-scroll/blob/master/demo/src/app/lists/list-item.component.ts).

```ts
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
                <span class="badge">{{item.age}} / {{item.gender}}</span>
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
```

Child component is not a necessity if your item is simple enough. See below.

```html
<virtual-scroll [items]="items" (update)="viewPortItems = $event">
    <div *ngFor="let item of viewPortItems">{{item?.name}}</div>
</virtual-scroll>
```

## API

| Attribute      | Type   | Description
|----------------|--------|------------
| items          | any[]  | The data that builds the templates within the virtual scroll. This is the same data that you'd pass to ngFor. It's important to note that when this data has changed, then the entire virtual scroll is refreshed.
| childWidth     | number | The minimum width of the item template's cell. This dimension is used to help determine how many cells should be created when initialized, and to help calculate the height of the scrollable area. Note that the actual rendered size of the first cell is used by default if not specified.
| childHeight    | number | The minimum height of the item template's cell. This dimension is used to help determine how many cells should be created when initialized, and to help calculate the height of the scrollable area. Note that the actual rendered size of the first cell is used by default if not specified.
| update         | Event  | This event is fired every time `start` or `end` index change and emits list of items from `start` to `end`. The list emitted by this event must be used with `*ngFor` to render the actual list of items within `<virtual-scroll>`
| change         | Event  | This event is fired every time `start` or `end` index change and emits `ChangeEvent` which of format: `{ start: number, end: number }`

## Items with variable size

Items must have fixed height and width for this module to work perfectly. However if your list happen to have items with variable width and height, set inputs `childWidth` and `childHeight` to the smallest possible values to make this work.

```html
<virtual-scroll [items]="items"
    [childWidth]="80"
    [childHeight]="30"
    (update)="viewPortItems = $event">

    <list-item *ngFor="let item of viewPortItems" [item]="item">
    </list-item>

</virtual-scroll>
```

## Loading in chunk

The event `end` is fired every time scroll reaches at the end of the list. You could use this to load more items at the end of the scroll. See below.

```ts

import { ChangeEvent } from '@angular2-virtual-scroll';
...

@Component({
    selector: 'list-with-api',
    template: `
        <virtual-scroll [items]="buffer" (update)="scrollItems = $event"
            (end)="fetchMore($event)">

            <list-item *ngFor="let item of scrollItems" [item]="item"> </list-item>
            <div *ngIf="loading" class="loader">Loading...</div>

        </virtual-scroll>
    `
})
export class ListWithApiComponent implements OnChanges {

    @Input()
    items: ListItem[];

    protected buffer: ListItem[] = [];
    protected loading: boolean;

    protected fetchMore(event: ChangeEvent) {
        if (event.end !== this.buffer.length) return;
        this.loading = true;
        this.fetchNextChunk(this.buffer.length, 10).then(chunk => {
            this.buffer = this.buffer.concat(chunk);
            this.loading = false;
        }, () => this.loading = false);
    }

    protected fetchNextChunk(skip: number, limit: number): Promise<ListItem[]> {
        return new Promise((resolve, reject) => {
            ....
        });
    }
}
```

## If container size change

If virtual scroll is used within a dropdown or collapsible menu, virtual scroll needs to know when the container size change. Use `refresh()` function after container is resized (include time for animation as well).

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroll [items]="items" (update)="scrollList = $event">
            <div *ngFor="let item of scrollList; let i = index"> {{i}}: {{item}} </div>
        </virtual-scroll>
    `
})
export class ListComponent {

    protected items = ['Item1', 'Item2', 'Item3'];

    @ViewChild(VirtualScrollComponent)
    private virtualScroll: VirtualScrollComponent;

    // call this function after resize + animation end
    afterResize() {
        this.virtualScroll.refresh();
    }
}
```

## Focus on an item

You could use `scrollInto(item)` api to scroll into an item in the list. See below:

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroll [items]="items" (update)="scrollList = $event">
            <div *ngFor="let item of scrollList; let i = index"> {{i}}: {{item}} </div>
        </virtual-scroll>
    `
})
export class ListComponent {

    protected items = ['Item1', 'Item2', 'Item3'];

    @ViewChild(VirtualScrollComponent)
    private virtualScroll: VirtualScrollComponent;

    // call this function whenever you have to focus on second item
    focusOnAnItem() {
        this.virtualScroll.scrollInto(items[1]);
    }
}
```

## Sorting Items

Always be sure to send an immutable copy of items to virtual scroll to avoid unintended behavior. You need to be careful when doing non-immutable operations such as sorting:

```ts
sort() {
  this.items = [].concat(this.items || []).sort()
}
```

This will be deprecated once [Resize Observer](https://wicg.github.io/ResizeObserver/) is fully implemented.

## Contributing
Contributions are very welcome! Just send a pull request. Feel free to contact me or checkout my [GitHub](https://github.com/rintoj) page.

## Author

**Rinto Jose** (rintoj)

### Hope this module is helpful to you. Please make sure to checkout my other [projects](https://github.com/rintoj) and [articles](https://medium.com/@rintoj). Enjoy coding!

Follow me:
  [GitHub](https://github.com/rintoj)
| [Facebook](https://www.facebook.com/rinto.jose)
| [Twitter](https://twitter.com/rintoj)
| [Google+](https://plus.google.com/+RintoJoseMankudy)
| [Youtube](https://youtube.com/+RintoJoseMankudy)

## Versions
[Check CHANGELOG](https://github.com/rintoj/angular2-virtual-scroll/blob/master/CHANGELOG.md)

## License
```
The MIT License (MIT)

Copyright (c) 2016 Rinto Jose (rintoj)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
