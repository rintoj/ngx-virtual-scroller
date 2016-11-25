
# angular2-virtual-scroll

Virtual Scroll displays a virtual, "infinite" list. Supports multi-column.

## About

This module does not render every record in the list at once; instead a small subset of records just enough to fill the viewport are rendered and reused as the user scrolls. Thus displaying an infinitely growing list of items in a viewport of size just about a couple rows in an efficient way is made possible.

* Supports multi-column
* Angular 2 compatible module
* Easy to use apis
* OpenSource and available in GitHub

### Important Note

Items must have fixed height and width for this module to work perfectly. However if your list happen to have items with variable width and height, set `childWidth` and `childHeight` to the smallest possible values manually to make this work.

## Demo

[See Demo Here](http://rintoj.github.io/angular2-virtual-scroll)

## Usage

```
<virtual-scroll [items]="items" (update)="viewPortItems = $event">

    <list-item *ngFor="let item of viewPortItems" [item]="item">
    </list-item>

</virtual-scroll>
```

## Get Started

**Step 1:** Install angular2-virtual-scroll

```
npm install angular2-virtual-scroll --save
```

**Step 2:** Import virtual scroll module into your app module

```
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

```
<virtual-scroll [items]="items" (update)="viewPortItems = $event">

    <list-item *ngFor="let item of viewPortItems" [item]="item">
    </list-item>

</virtual-scroll>
```

**Step 4:** Create 'list-item' component.

'list-item' must a custom angular2 component, outside of this library. A sample list item is give below or check the [demo app](https://github.com/rintoj/angular2-virtual-scroll/tree/master/demo) for [list-item.component.ts](https://github.com/rintoj/angular2-virtual-scroll/blob/master/demo/src/app/lists/list-item.component.ts).

```
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

```
<virtual-scroll [items]="items" (update)="viewPortItems = $event">
    <div *ngFor="let item of viewPortItems">{{item?.name}}</div>
</virtual-scroll>
```

## Contributing
Contributions are very welcome! Just send a pull request. Feel free to contact me or checkout my [GitHub](https://github.com/rintoj) page.

## Author

**Rinto Jose** (rintoj)

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
