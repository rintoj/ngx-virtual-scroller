
# angular2-virtual-scroll

Virtual Scroll displays a virtual, "infinite" list. Supports multi-column.

## About

This module displays a small subset of records just enough to fill the viewport and uses the same DOM elements as the user scrolls.
This method is effective because the number of DOM elements are always constant and tiny irrespective of the size of the list. Thus virtual scroll can display an infinitely growing list of items in an efficient way.

* Angular 2 compatible module
* Supports multi-column
* Easy to use apis
* OpenSource and available in GitHub

## New features:

* Added ability to put other elements inside of scroll (Need to wrap list itself in @ContentChild('container'))
* Added ability to use any parent with scrollbar instead of this element (@Input() parentScroll)
* Added ability to use horizontal scrollbars

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
<virtual-scroll #scroll [items]="items">

    <list-item *ngFor="let item of scroll.viewPortItems" [item]="item">
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

You must also define width and height for the container and for it's children.

```css
virtual-scroll {
  display: block;
  width: 350px;
  height: 200px;
}

list-item {
  display: block;
  width: 100%;
  height: 30px;
}

```

**Step 4:** Create 'list-item' component.

'list-item' must be a custom angular2 component, outside of this library. A sample list item is give below or check the [demo app](https://github.com/rintoj/angular2-virtual-scroll/tree/master/demo) for [list-item.component.ts](https://github.com/rintoj/angular2-virtual-scroll/blob/master/demo/src/app/lists/list-item.component.ts).

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

Child component is not necessary if your item is simple enough. See below.

```html
<virtual-scroll [items]="items" (update)="viewPortItems = $event">
    <div *ngFor="let item of viewPortItems">{{item?.name}}</div>
</virtual-scroll>
```

## API

| Attribute      | Type   | Description
|----------------|--------|------------
| scrollbarWidth | number | If you want to override the auto-calculated scrollbar width. This is used to determine the dimensions of the viewable area when calculating the number of items to render.
| scrollbarHeight | number | If you want to override the auto-calculated scrollbar height. This is used to determine the dimensions of the viewable area when calculating the number of items to render.
| horizontal | boolean | Whether the scrollbars should be vertical or horizontal. Defaults to false.
| items          | any[]  | The data that builds the templates within the virtual scroll. This is the same data that you'd pass to ngFor. It's important to note that when this data has changed, then the entire virtual scroll is refreshed.
| childWidth     | number | The minimum width of the item template's cell. This dimension is used to help determine how many cells should be created when initialized, and to help calculate the height of the scrollable area. Note that the actual rendered size of the first cell is used by default if not specified.
| childHeight    | number | The minimum height of the item template's cell. This dimension is used to help determine how many cells should be created when initialized, and to help calculate the height of the scrollable area. Note that the actual rendered size of the first cell is used by default if not specified.
| bufferAmount   | number | The the number of elements to be rendered outside of the current container's viewport. Useful when not all elements are the same dimensions.
| scrollAnimationTime | number | The time in milliseconds for the scroll animation to run for. Default value is 1500. 0 will completely disable the tween/animation.
| parentScroll   | Element / Window | Element (or window), which will have scrollbar. This element must be one of the parents of virtual-scroll
| start         | Event  | This event is fired every time `start` index changes and emits `ChangeEvent` which of format: `{ start: number, end: number }`
| end         | Event  | This event is fired every time `end` index changes and emits `ChangeEvent` which of format: `{ start: number, end: number }`
| update         | Event  | This event is fired every time the `start` or `end` indexes change and emits the list of items which should be visible based on the current scroll position from `start` to `end`. The list emitted by this event must be used with `*ngFor` to render the actual list of items within `<virtual-scroll>`
| change         | Event  | This event is fired every time the `start` or `end` indexes change and emits `ChangeEvent` which of format: `{ start: number, end: number }`

## Getting view port items without events

If you are using AOT compilation (I hope you are) then with classic usage (listening to `update` event) you are required to create a public field `viewPortItems` in your component.
Here's a way to avoid it:
```html
<virtual-scroll #scroll [items]="items">

    <list-item *ngFor="let item of scroll.viewPortItems" [item]="item">
    </list-item>

</virtual-scroll>
```

## Additional elements in scroll

If you want to nest additional elements inside virtual scroll besides the list itself (e.g. search field), you need to wrap those elements in a tag with an angular selector name of #container.

```html
<virtual-scroll [items]="items"
    (update)="viewPortItems = $event">
    <input type="search">
    <div #container>
        <list-item *ngFor="let item of viewPortItems" [item]="item">
        </list-item>
    </div>
</virtual-scroll>
```

## Use parent scrollbar

If you want to use the scrollbar of a parent element, set `parentScroll`.

```html
<div #scrollingBlock>
    <virtual-scroll [items]="items"
        [parentScroll]="scrollingBlock.nativeElement"
        (update)="viewPortItems = $event">
        <input type="search">
        <div #container>
            <list-item *ngFor="let item of viewPortItems" [item]="item">
            </list-item>
        </div>
    </virtual-scroll>
</div>
```

Note: The parent element must have a width and height defined.

## Use scrollbar of window

If you want to use the window's scrollbar, set `parentScroll`.

```html
<virtual-scroll
    #scroll
    [items]="items"
    [parentScroll]="scroll.window">
    <input type="search">
    <div #container>
        <list-item *ngFor="let item of scroll.viewPortItems" [item]="item">
        </list-item>
    </div>
</virtual-scroll>
```

Note: The body element must have a width and height defined.

## Items with variable size

Items must have fixed height and width for this module to work perfectly. However if you have items with variable width and height, set inputs `childWidth` and `childHeight` to their smallest possible values.

```html
<virtual-scroll [items]="items"
    [childWidth]="80"
    [childHeight]="30"
    (update)="viewPortItems = $event">

    <list-item *ngFor="let item of viewPortItems" [item]="item">
    </list-item>

</virtual-scroll>
```

## Loading in chunks

The event `end` is fired every time the scrollbar reaches the end of the list. You could use this to dynamically load more items at the end of the scroll. See below.

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

## If container size changes

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

## Focus an item

You can use the `scrollInto(item)` api to scroll into an item in the list. See below:

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
        this.virtualScroll.items = this.items;
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

* **Rinto Jose** (rintoj)
* **Pavel Kukushkin** (kykint)

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
