
# angular2-virtual-scroll

Virtual Scroll displays a virtual, "infinite" list. Supports multi-column.

## About

This module displays a small subset of records just enough to fill the viewport and uses the same DOM elements as the user scrolls.
This method is effective because the number of DOM elements are always constant and tiny irrespective of the size of the list. Thus virtual scroll can display an infinitely growing list of items in an efficient way.

* Angular 4+ compatible module
* Supports multi-column
* Easy to use apis
* OpenSource and available in GitHub

## Breaking Changes:
* v0.4.13: resizeBypassRefreshTheshold renamed to resizeBypassRefreshThreshold (typo)
* v0.4.12: The start and end values of the change/start/end events were including bufferAmount, which made them confusing. This has been corrected.
	viewPortIndices.arrayStartIndex renamed to viewPortIndices.startIndex and viewPortIndices.arrayEndIndex renamed to viewPortIndices.endIndex
* v0.4.4: The value of ChangeEvent.end wasn't intuitive. This has been corrected. Both ChangeEvent.start and ChangeEvent.end are the 0-based array indexes of the items being rendered in the viewport. (Previously Change.End was the array index + 1)

## New features:

* Added API to query for current scroll px position (also passed as argument to ChangeEvent listeners)
* Added API to invalidate cached child item measurements (if your child item sizes change dynamically)
* Added API to scroll to specific px position
* If scroll container resizes, the items will auto-refresh. Can be disabled if it causes any performance issues by setting [checkResizeInterval]="0"
* useMarginInsteadOfTranslate flag. Defaults to false. This can affect performance (better/worse depending on your circumstances), and also creates a workaround for the transform+position:fixed browser bug.
* Support for horizontal scrollbars
* Support for elements with different sizes
* Added ability to put other elements inside of scroll (Need to wrap list itself in @ContentChild('container'))
* Added ability to use any parent with scrollbar instead of this element (@Input() parentScroll)
 
## Demo

[See Demo Here](http://rintoj.github.io/angular2-virtual-scroll)

## Usage

```html
<virtual-scroll #scroll [items]="items">

    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>

</virtual-scroll>
```

alternatively

```html
<virtual-scroll [items]="items" (vsUpdate)="viewPortItems = $event">

    <my-custom-component *ngFor="let item of viewPortItems">
    </my-custom-component>

</virtual-scroll>
```

alternatively

```html
<div virtualScroll [items]="items" (vsUpdate)="viewPortItems = $event">

    <my-custom-component *ngFor="let item of viewPortItems">
    </my-custom-component>

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

**Step 3:** Wrap virtual-scroll tag around elements;

```ts
<virtual-scroll #scroll [items]="items">

    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>

</virtual-scroll>
```

You must also define width and height for the container and for its children.

```css
virtual-scroll {
  display: block;
  width: 350px;
  height: 200px;
}

my-custom-component {
  display: block;
  width: 100%;
  height: 30px;
}

```

**Step 4:** Create 'my-custom-component' component.

'my-custom-component' must be a custom angular2 component, outside of this library.

Child component is not necessary if your item is simple enough. See below.

```html
<virtual-scroll #scroll [items]="items">
    <div *ngFor="let item of scroll.viewPortItems">{{item?.name}}</div>
</virtual-scroll>
```

## API

| Attribute      | Type   | Description
|----------------|--------|------------
| checkResizeInterval | number | How often in milliseconds to check if virtual-scroll (or parentScroll) has been resized. If resized, it'll call Refresh() method. Defaults to 1000. Can be injected by DI with token "virtualScroll.checkResizeInterval".
| resizeBypassRefreshThreshold | number | How many pixels to ignore during resize check if virtual-scroll (or parentScroll) are only resized by a very small amount. Defaults to 5. Can be injected by DI with token "virtualScroll.resizeBypassRefreshThreshold".
| enableUnequalChildrenSizes | boolean | If you want to use the "unequal size" children feature. This is not perfect, but hopefully "close-enough" for most situations. Defaults to false.
| scrollThrottlingTime | number | Milliseconds to delay refreshing viewport if user is scrolling quickly (for performance reasons). Default is 0. Can be injected by DI with token "virtualScroll.scrollThrottlingTime".
| useMarginInsteadOfTranslate | boolean | Defaults to false. Translate is faster in many scenarios because it can use GPU acceleration, but it can be slower if your scroll container or child elements don't use any transitions or opacity. More importantly, translate creates a new "containing block" which breaks position:fixed because it'll be relative to the transform rather than the window. If you're experiencing issues with position:fixed on your child elements, turn this flag on.
| scrollbarWidth | number | If you want to override the auto-calculated scrollbar width. This is used to determine the dimensions of the viewable area when calculating the number of items to render. Can be injected by DI with token "virtualScroll.scrollbarWidth".
| scrollbarHeight | number | If you want to override the auto-calculated scrollbar height. This is used to determine the dimensions of the viewable area when calculating the number of items to render. Can be injected by DI with token "virtualScroll.scrollbarHeight".
| horizontal | boolean | Whether the scrollbars should be vertical or horizontal. Defaults to false.
| items          | any[]  | The data that builds the templates within the virtual scroll. This is the same data that you'd pass to ngFor. It's important to note that when this data has changed, then the entire virtual scroll is refreshed.
| childWidth (DEPRECATED)     | number | The minimum width of the item template's cell. Use this if enableUnequalChildrenSizes isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)
| childHeight (DEPRECATED)    | number | The minimum height of the item template's cell. Use this if enableUnequalChildrenSizes isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)
| bufferAmount (DEPRECATED)  | number | The number of elements to be rendered above & below the current container's viewport. Increase this if enableUnequalChildrenSizes isn't working well enough. (defaults to enableUnequalChildrenSizes ? 5 : 0)
| scrollAnimationTime | number | The time in milliseconds for the scroll animation to run for. Default value is 750. 0 will completely disable the tween/animation. Can be injected by DI with token "virtualScroll.scrollAnimationTime".
| parentScroll   | Element / Window | Element (or window), which will have scrollbar. This element must be one of the parents of virtual-scroll
| compareItems   | Function | Predicate of syntax (item1:any, item2:any)=>boolean which is used when items array is modified to determine which items have been changed (determines if cached child size measurements need to be refreshed or not for enableUnequalChildrenSizes). Defaults to === comparison.
| start (DEPRECATED) / vsStart         | Event  | This event is fired every time `start` index changes and emits `ChangeEvent` which is of format: `{ start: number, end: number, scrollStartPosition:number, scrollEndPosition:number }`
| end (DEPRECATED) / vsEnd         | Event  | This event is fired every time `end` index changes and emits `ChangeEvent` which is of format: `{ start: number, end: number, scrollStartPosition:number, scrollEndPosition:number }`
| update (DEPRECATED) / vsUpdate         | Event  | This event is fired every time the `start` or `end` indexes change and emits the list of items which should be visible based on the current scroll position from `start` to `end`. The list emitted by this event must be used with `*ngFor` to render the actual list of items within `<virtual-scroll>`
| change (DEPRECATED) / vsChange         | Event  | This event is fired every time the `start` or `end` indexes or scroll position change and emits `ChangeEvent` which is of format: `{ start: number, end: number, scrollStartPosition:number, scrollEndPosition:number }`
| viewPortIndices (DEPRECATED. use viewPortInfo instead) | { startIndex: number, endIndex: number } | Allows querying the visible item indexes in the viewport on demand rather than listening for events.
| viewPortInfo | { startIndex:number, endIndex:number, scrollStartPosition:number, scrollEndPosition:number, maxScrollPosition:number } | Allows querying the the current viewport info on demand rather than listening for events.
| viewPortItems | any[] | The array of items currently being rendered to the viewport.
| refresh (DEPRECATED) | ()=>void | Function to force re-rendering of current items in viewport.
| invalidateAllCachedMeasurements | ()=>void | Function to force re-measuring *all* cached item sizes. If enableUnequalChildrenSizes===false, only 1 item will be re-measured.
| invalidateCachedMeasurementForItem | (item:any)=>void | Function to force re-measuring cached item size.
| invalidateCachedMeasurementAtIndex | (index:number)=>void | Function to force re-measuring cached item size.
| scrollInto | (item:any, alignToBeginning:boolean = true, additionalOffset:number = 0, animationMilliseconds:number = undefined, animationCompletedCallback:()=>void = undefined)=>void | Scrolls to item
| scrollToIndex | (index:number, alignToBeginning:boolean = true, additionalOffset:number = 0, animationMilliseconds:number = undefined, animationCompletedCallback:()=>void = undefined)=>void | Scrolls to item at index
| scrollToPosition | (scrollPosition:number, animationMilliseconds:number = undefined, animationCompletedCallback: ()=>void = undefined)=>void | Scrolls to px position
| ssrChildWidth | number | The hard-coded width of the item template's cell to use if rendering via Angular Universal/Server-Side-Rendering
| ssrChildHeight | number | The hard-coded height of the item template's cell to use if rendering via Angular Universal/Server-Side-Rendering
| ssrViewportWidth | number | The hard-coded visible width of the virtual-scroll (or [parentScroll]) to use if rendering via Angular Universal/Server-Side-Rendering. Defaults to 1920.
| ssrViewportHeight | number | The hard-coded visible height of the virtual-scroll (or [parentScroll]) to use if rendering via Angular Universal/Server-Side-Rendering. Defaults to 1080.

Note: The Events without the "vs" prefix have been deprecated because they might conflict with native DOM events due to their "bubbling" nature. See https://github.com/angular/angular/issues/13997
An example is if an <input> element inside <virtual-scroll> emits a "change" event which bubbles up to the (change) handler of virtual-scroll. Using the vs prefix will prevent this bubbling conflict because there are currently no official DOM events prefixed with vs.

## Getting view port items without events

If you are using AOT compilation (I hope you are) then with classic usage (listening to `update` event) you are required to create a public field `viewPortItems` in your component.
Here's a way to avoid it:
```html
<virtual-scroll #scroll [items]="items">

    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>

</virtual-scroll>
```

## Additional elements in scroll

If you want to nest additional elements inside virtual scroll besides the list itself (e.g. search field), you need to wrap those elements in a tag with an angular selector name of #container.

```html
<virtual-scroll #scroll [items]="items">
    <input type="search">
    <div #container>
        <my-custom-component *ngFor="let item of scroll.viewPortItems">
        </my-custom-component>
    </div>
</virtual-scroll>
```

## Use parent scrollbar

If you want to use the scrollbar of a parent element, set `parentScroll` to a native DOM element.

```html
<div #scrollingBlock>
    <virtual-scroll #scroll [items]="items" [parentScroll]="scrollingBlock">
        <input type="search">
        <div #container>
            <my-custom-component *ngFor="let item of scroll.viewPortItems">
            </my-custom-component>
        </div>
    </virtual-scroll>
</div>
```

If the parentScroll is a custom angular component (instead of a native HTML element such as DIV), Angular will wrap the #scrollingBlock variable in an ElementRef https://angular.io/api/core/ElementRef in which case you'll need to use the .nativeElement property to get to the underlying javascript DOM element reference.

```html
<custom-angular-component #scrollingBlock>
    <virtual-scroll #scroll [items]="items" [parentScroll]="scrollingBlock.nativeElement">
        <input type="search">
        <div #container>
            <my-custom-component *ngFor="let item of scroll.viewPortItems">
            </my-custom-component>
        </div>
    </virtual-scroll>
</custom-angular-component>
```

Note: The parent element should have a width and height defined.

## Use scrollbar of window

If you want to use the window's scrollbar, set `parentScroll`.

```html
<virtual-scroll #scroll [items]="items" [parentScroll]="scroll.window">
    <input type="search">
    <div #container>
        <my-custom-component *ngFor="let item of scroll.viewPortItems">
        </my-custom-component>
    </div>
</virtual-scroll>
```

## Items with variable size

Items must have fixed height and width for this module to work perfectly. If not, set [enableUnequalChildrenSizes]="true".

(DEPRECATED): If enableUnequalChildrenSizes isn't working, you can set inputs `childWidth` and `childHeight` to their smallest possible values. You can also modify `bufferAmount` which causes extra items to be rendered on the edges of the scrolling area.

```html
<virtual-scroll #scroll [items]="items" [enableUnequalChildrenSizes]="true">

    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>

</virtual-scroll>
```

## Loading in chunks

The event `end` is fired every time the scrollbar reaches the end of the list. You could use this to dynamically load more items at the end of the scroll. See below.

```ts

import { ChangeEvent } from 'angular2-virtual-scroll';
...

@Component({
    selector: 'list-with-api',
    template: `
        <virtual-scroll [items]="buffer" (vsUpdate)="scrollItems = $event"
            (vsEnd)="fetchMore($event)">

            <my-custom-component *ngFor="let item of scrollItems"> </my-custom-component>
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
        if (event.end !== this.buffer.length-1) return;
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

## With HTML Table

Note: There is no support for a fixed-to-top-header.

```html
<virtual-scroll #scroll [items]="myItems">
	<table>
		<thead>
			<th>Index</th>
			<th>Name</th>
			<th>Gender</th>
			<th>Age</th>
			<th>Address</th>
		</thead>
		<tbody #container>
			<tr *ngFor="let item of scroll.viewPortItems">
				<td>{{item.index}}</td>
				<td>{{item.name}}</td>
				<td>{{item.gender}}</td>
				<td>{{item.age}}</td>
				<td>{{item.address}}</td>
			</tr>
		</tbody>
	</table>
</virtual-scroll>
```

## If child size changes
virtual-scroll caches the measurements for the rendered items. If enableUnequalChildrenSizes===true then each item is measured and cached separately. Otherwise, the 1st measured item is used for all items.
If your items can change sizes dynamically, you'll need to notify virtual-scroll to re-measure them. There are 3 methods for doing this:
```ts
virtualScroll.invalidateAllCachedMeasurements();
virtualScroll.invalidateCachedMeasurementForItem(item: any);
virtualScroll.invalidateCachedMeasurementAtIndex(index: number);
```

## If container size changes

Note: This should now be auto-detected, however the 'refresh' method can still force it if neeeded.
	This was implemented using the setInterval method which may cause minor performance issues. It shouldn't be noticeable, but can be disabled via [checkResizeInterval]="0"
	Performance will be improved once "Resize Observer" (https://wicg.github.io/ResizeObserver/) is fully implemented.

Refresh method (DEPRECATED)
If virtual scroll is used within a dropdown or collapsible menu, virtual scroll needs to know when the container size changes. Use `refresh()` function after container is resized (include time for animation as well).

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroll [items]="items" (vsUpdate)="scrollList = $event">
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

You can use the `scrollInto(item, alignToBeginning?, additionalOffset?, animationMilliseconds?, animationCompletedCallback?)` api to scroll into an item in the list.
You can also use the `scrollToIndex(index, alignToBeginning?, additionalOffset?, animationMilliseconds?, animationCompletedCallback?)` api for the same purpose.
See below:

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroll [items]="items" (vsUpdate)="scrollList = $event">
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

## Dependency Injection of configuration settings

Some config settings can be set via DI, so you can set them globally instead of on each instance of virtual-scroll.

```ts
 providers: [
    {  provide: 'virtualScroll.scrollThrottlingTime', useValue: 0  },
    {  provide: 'virtualScroll.scrollAnimationTime', useValue: 750  },
	{  provide: 'virtualScroll.scrollbarWidth', useValue: undefined  },
	{  provide: 'virtualScroll.scrollbarHeight', useValue: undefined  },
	{  provide: 'virtualScroll.checkResizeInterval', useValue: 1000  },
	{  provide: 'virtualScroll.resizeBypassRefreshThreshold', useValue: 5  }
  ],
```


## Sorting Items

Always be sure to send an immutable copy of items to virtual scroll to avoid unintended behavior. You need to be careful when doing non-immutable operations such as sorting:

```ts
sort() {
  this.items = [].concat(this.items || []).sort()
}
```

## Hide Scrollbar

This hacky CSS allows hiding a scrollbar while still enabling scroll through mouseWheel/touch/pageUpDownKeys
```css
	//hide vertical scrollbar
	   margin-right: -25px;
	   padding-right: 25px;
	
	//hide horizontal scrollbar
	   margin-bottom: -25px;
	   padding-bottom: 25px;
```

## Angular Universal / Server-Side Rendering

The initial SSR render isn't a fully functioning site, it's essentially an HTML "screenshot" (HTML/CSS, but no JS). However, it immediately swaps out your "screenshot" with the real site as soon as the full app has downloaded in the background. The intent of SSR is to give a correct visual very quickly, because a full angular app could take a long time to download. This makes the user *think* your site is fast, because hopefully they won't click on anything that requires JS before the fully-functioning site has finished loading in the background. Also, it allows screen scrapers without javascript to work correctly (example: Facebook posts/etc).
virtual-scroll relies on javascript APIs to measure the size of child elements and the scrollable area of their parent. These APIs do not work in SSR because the HTML/CSS "screenshot" is generated on the server via Node, it doesn't execute/render the site as a browser would. This means virtual-scroll will see all measurements as undefined and the "screenshot" will not be generated correctly. Most likely, only 1 child element will appear in your virtual-scroll. This "screenshot" can be fixed with polyfills. However, when the browser renders the "screenshot", the scrolling behaviour still won't work until the full app has loaded.

SSR is an advanced (and complex) topic that can't be fully addressed here. Please research this on your own. However, here are some suggestions:
1) Use https://www.npmjs.com/package/domino and https://www.npmjs.com/package/raf polyfills in your main.server.ts file
```
const domino = require('domino');
require('raf/polyfill');
const win = domino.createWindow(template);
win['versionNumber'] = 'development';
global['window'] = win;
global['document'] = win.document;
Object.defineProperty(win.document.body.style, 'transform', { value: () => { return { enumerable: true, configurable: true }; } });
```
2) Determine a default screen size you want to use for the SSR "screenshot" calculations (suggestion: 1920x1080). This won't be accurate for all users, but will hopefully be close enough. Once the full Angular app loads in the background, their real device screensize will take over.
3) Run your app in a real browser without SSR and determine the average width/height of the child elements inside virtual-scroll as well as the width/height of the virtual-scroll (or [parentScroll] element). Use these values to set the [ssrChildWidth]/[ssrChildHeight]/[ssrViewportWidth]/[ssrViewportHeight] properties.
```
<virtual-scroll #scroll [items]="items">

    <my-custom-component *ngFor="let item of scroll.viewPortItems" [ssrChildWidth]="138" [ssrChildHeight]="175" [ssrViewportWidth]="1500" [ssrViewportHeight]="800">
    </my-custom-component>

</virtual-scroll>
```

## Contributing
Contributions are very welcome! Just send a pull request. Feel free to contact me or checkout my [GitHub](https://github.com/rintoj) page.

## Authors

* **Rinto Jose** (rintoj)
* **Devin Garner** (speige)
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
