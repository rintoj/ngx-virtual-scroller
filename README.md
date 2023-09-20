# ngx-virtual-scroller

Virtual Scroll displays a virtual, "infinite" list. Supports horizontal/vertical, variable heights, & multi-column.
compatible with angular v16+ 
## Renamed from `angular2-virtual-scroll` or `ngx-virtual-scroller` to `@tt-tech/ngx-virtual-scroller`. Please update your _package.json_

## About

This module displays a small subset of records just enough to fill the viewport and uses the same DOM elements as the user scrolls.
This method is effective because the number of DOM elements are always constant and tiny irrespective of the size of the list. Thus virtual scroll can display an infinitely growing list of items in an efficient way.

- Supports multi-column
- Easy to use APIs
- Open source and available in GitHub

## Breaking Changes:

- `v16.0.3` Several deprecated properties removed & dependicies version are upgraded .

## New features:

 - RTL Support on Horizontal scrollers
 - Support for fixed `<thead>` on `<table>` elements.
 - Added API to query for current scroll px position (also passed as argument to `IPageInfo` listeners)
 - Added API to invalidate cached child item measurements (if your child item sizes change dynamically)
 - Added API to scroll to specific px position
 - If scroll container resizes, the items will auto-refresh. Can be disabled if it causes any performance issues by setting `[checkResizeInterval]="0"`
 - `useMarginInsteadOfTranslate` flag. Defaults to _false_. This can affect performance (better/worse depending on your circumstances), and also creates a workaround for the transform+position:fixed browser bug.
 - Support for horizontal scrollbars
 - Support for elements with different sizes
 - Added ability to put other elements inside of scroll (Need to wrap list itself in @ContentChild('container'))
 - Added ability to use any parent with scrollbar instead of this element (@Input() parentScroll)

## Demo

[See Demo Here](http://rintoj.github.io/ngx-virtual-scroller)

## Usage

Preferred option:
```html
<virtual-scroller #scroll [items]="items">
    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>
</virtual-scroller>
```

option 2:
note: viewPortItems must be a public field to work with AOT
```html
<virtual-scroller [items]="items" (vsUpdate)="viewPortItems = $event">
    <my-custom-component *ngFor="let item of viewPortItems">
    </my-custom-component>
</virtual-scroller>
```

option 3:
note: viewPortItems must be a public field to work with AOT
```html
<div virtualScroller [items]="items" (vsUpdate)="viewPortItems = $event">
    <my-custom-component *ngFor="let item of viewPortItems">
    </my-custom-component>
</div>
```

## Get Started

**Step 1:** Install @tt-tech/ngx-virtual-scroller

```sh
npm install @tt-tech/ngx-virtual-scroller
```

**Step 2:** Import virtual scroll module into your app module

```ts
....
import { VirtualScrollerModule } from '@tt-tech/ngx-virtual-scroller';

....

@NgModule({
    ...
    imports: [
        ....
        VirtualScrollerModule
    ],
    ....
})
export class AppModule { }
```

**Step 3:** Wrap _virtual-scroller_ tag around elements;

```html
<virtual-scroller #scroll [items]="items">
    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>
</virtual-scroller>
```

You must also define width and height for the container and for its children.

```css
virtual-scroller {
  width: 350px;
  height: 200px;
}

my-custom-component {
  display: block;
  width: 100%;
  height: 30px;
}
```

**Step 4:** Create `my-custom-component` component.

`my-custom-component` must be a custom _angular_ component, outside of this library.

Child component is not necessary if your item is simple enough. See below.

```html
<virtual-scroller #scroll [items]="items">
    <div *ngFor="let item of scroll.viewPortItems">{{item?.name}}</div>
</virtual-scroller>
```

## Interfaces
```ts
interface IPageInfo {
	startIndex: number;
	endIndex: number;
	scrollStartPosition: number;
	scrollEndPosition: number;
	startIndexWithBuffer: number;
	endIndexWithBuffer: number;
	maxScrollPosition: number;
}
```

## API

In _alphabetical_ order:

| Attribute                          | `Type` & Default  | Description
|------------------------------------|-------------------|--------------|
| bufferAmount                       | `number` enableUnequalChildrenSizes ? 5 : 0 | The number of elements to be rendered above & below the current container's viewport. Increase this if `enableUnequalChildrenSizes` isn't working well enough.
| checkResizeInterval                | `number` 1000     | How often in milliseconds to check if _virtual-scroller_ (or parentScroll) has been resized. If resized, it'll call `Refresh()` method
| compareItems                       | `Function` === comparison | Predicate of syntax `(item1:any, item2:any)=>boolean` which is used when items array is modified to determine which items have been changed (determines if cached child size measurements need to be refreshed or not for `enableUnequalChildrenSizes`).
| enableUnequalChildrenSizes         | `boolean` false   | If you want to use the "unequal size" children feature. This is not perfect, but hopefully "close-enough" for most situations.
| executeRefreshOutsideAngularZone   | `boolean` false   | Disables full-app Angular ChangeDetection while scrolling, which can give a performance boost. Requires developer to manually execute change detection on any components which may have changed. USE WITH CAUTION - Read the "Performance" section below.
| horizontal                         | `boolean` false   | Whether the scrollbars should be vertical or horizontal.
| invalidateAllCachedMeasurements    | `Function`        | `()=>void` - to force re-measuring *all* cached item sizes. If `enableUnequalChildrenSizes===false`, only 1 item will be re-measured.
| invalidateCachedMeasurementAtIndex | `Function`        | `(index:number)=>void` - to force re-measuring cached item size.
| invalidateCachedMeasurementForItem | `Function`        | `(item:any)=>void` - to force re-measuring cached item size.
| items                              | any[]             | The data that builds the templates within the virtual scroll. This is the same data that you'd pass to `ngFor`. It's important to note that when this data has changed, then the entire virtual scroll is refreshed.
| modifyOverflowStyleOfParentScroll  | `boolean` true    | Set to false if you want to prevent _ngx-virtual-scroller_ from automatically changing the overflow style setting of the parentScroll element to 'scroll'.
| parentScroll                       | Element / Window  | Element (or window), which will have scrollbar. This element must be one of the parents of virtual-scroller
| refresh                            | `Function`        | `()=>void` - to force re-rendering of current items in viewport.
| RTL                                | `boolean` false   | Set to `true` if you want horizontal slider to support right to left script (RTL).
| resizeBypassRefreshThreshold       | `number` 5        | How many pixels to ignore during resize check if _virtual-scroller_ (or parentScroll) are only resized by a very small amount.
| scrollAnimationTime                | `number` 750      | The time in milliseconds for the scroll animation to run for. 0 will completely disable the tween/animation.
| scrollDebounceTime                 | `number` 0        | Milliseconds to delay refreshing viewport if user is scrolling quickly (for performance reasons).
| scrollInto                         | `Function`        | `(item:any, alignToBeginning:boolean = true, additionalOffset:number = 0, animationMilliseconds:number = undefined, animationCompletedCallback:()=>void = undefined)=>void` - Scrolls to item
| scrollThrottlingTime               | `number` 0        | Milliseconds to delay refreshing viewport if user is scrolling quickly (for performance reasons).
| scrollToIndex                      | `Function`        | `(index:number, alignToBeginning:boolean = true, additionalOffset:number = 0, animationMilliseconds:number = undefined, animationCompletedCallback:()=>void = undefined)=>void` - Scrolls to item at index
| scrollToPosition                   | `Function`        | `(scrollPosition:number, animationMilliseconds:number = undefined, animationCompletedCallback: ()=>void = undefined)=>void` - Scrolls to px position
| scrollbarHeight                    | `number`          | If you want to override the auto-calculated scrollbar height. This is used to determine the dimensions of the viewable area when calculating the number of items to render.
| scrollbarWidth                     | `number`          | If you want to override the auto-calculated scrollbar width. This is used to determine the dimensions of the viewable area when calculating the number of items to render.
| ssrChildHeight                     | `number`          | The hard-coded height of the item template's cell to use if rendering via _Angular Universal/Server-Side-Rendering_
| ssrChildWidth                      | `number`          | The hard-coded width of the item template's cell to use if rendering via _Angular Universal/Server-Side-Rendering_
| ssrViewportHeight                  | `number` 1080     | The hard-coded visible height of the _virtual-scroller_ (or [parentScroll]) to use if rendering via _Angular Universal/Server-Side-Rendering_.
| ssrViewportWidth                   | `number` 1920     | The hard-coded visible width of the _virtual-scroller_ (or [parentScroll]) to use if rendering via _Angular Universal/Server-Side-Rendering_.
| stripedTable                       | `boolean` false   | Set to true if you use a striped table. In this case, the rows will be added/removed two by two to keep the strips consistent.
| useMarginInsteadOfTranslate        | `boolean` false   | Translate is faster in many scenarios because it can use GPU acceleration, but it can be slower if your scroll container or child elements don't use any transitions or opacity. More importantly, translate creates a new "containing block" which breaks position:fixed because it'll be relative to the transform rather than the window. If you're experiencing issues with position:fixed on your child elements, turn this flag on.
| viewPortInfo                       | `IPageInfo`       | Allows querying the the current viewport info on demand rather than listening for events.
| viewPortItems                      | any[]             | The array of items currently being rendered to the viewport.
| vsChange                           | `Event<IPageInfo>`| This event is fired every time the `start` or `end` indexes or scroll position change and emits `IPageInfo`.
| vsEnd                              | `Event<IPageInfo>`| This event is fired every time `end` index changes and emits `IPageInfo`.
| vsStart                            | `Event<IPageInfo>`| This event is fired every time `start` index changes and emits `IPageInfo`.
| vsUpdate                           | `Event<any[]>`    | This event is fired every time the `start` or `end` indexes change and emits the list of items which should be visible based on the current scroll position from `start` to `end`. The list emitted by this event must be used with `*ngFor` to render the actual list of items within `<virtual-scroller>`
| childHeight *(DEPRECATED)*         | `number`          | The minimum height of the item template's cell. Use this if `enableUnequalChildrenSizes` isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)
| childWidth *(DEPRECATED)*          | `number`          | The minimum width of the item template's cell. Use this if `enableUnequalChildrenSizes` isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)

*Note* - The Events without the "vs" prefix have been deprecated because they might conflict with native DOM events due to their "bubbling" nature. See https://github.com/angular/angular/issues/13997

An example is if an `<input>` element inside `<virtual-scroller>` emits a "change" event which bubbles up to the (change) handler of _virtual-scroller_. Using the vs prefix will prevent this bubbling conflict because there are currently no official DOM events prefixed with vs.

## Use parent scrollbar

If you want to use the scrollbar of a parent element, set `parentScroll` to a native DOM element.

```html
<div #scrollingBlock>
    <virtual-scroller #scroll [items]="items" [parentScroll]="scrollingBlock">
        <input type="search">
        <div #container>
            <my-custom-component *ngFor="let item of scroll.viewPortItems">
            </my-custom-component>
        </div>
    </virtual-scroller>
</div>
```

If the parentScroll is a custom angular component (instead of a native HTML element such as DIV), Angular will wrap the `#scrollingBlock` variable in an ElementRef https://angular.io/api/core/ElementRef in which case you'll need to use the `.nativeElement` property to get to the underlying JavaScript DOM element reference.

```html
<custom-angular-component #scrollingBlock>
    <virtual-scroller #scroll [items]="items" [parentScroll]="scrollingBlock.nativeElement">
        <input type="search">
        <div #container>
            <my-custom-component *ngFor="let item of scroll.viewPortItems">
            </my-custom-component>
        </div>
    </virtual-scroller>
</custom-angular-component>
```

*Note* - The parent element should have a width and height defined.

## Use scrollbar of window

If you want to use the window's scrollbar, set `parentScroll`.

```html
<virtual-scroller #scroll [items]="items" [parentScroll]="scroll.window">
    <input type="search">
    <div #container>
        <my-custom-component *ngFor="let item of scroll.viewPortItems">
        </my-custom-component>
    </div>
</virtual-scroller>
```

## Items with variable size

Items _must_ have fixed height and width for this module to work perfectly. If not, set `[enableUnequalChildrenSizes]="true"`.

*(DEPRECATED)*: If `enableUnequalChildrenSizes` isn't working, you can set inputs `childWidth` and `childHeight` to their smallest possible values. You can also modify `bufferAmount` which causes extra items to be rendered on the edges of the scrolling area.

```html
<virtual-scroller #scroll [items]="items" [enableUnequalChildrenSizes]="true">

    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>

</virtual-scroller>
```

## Loading in chunks

The event `vsEnd` is fired every time the scrollbar reaches the end of the list. You could use this to dynamically load more items at the end of the scroll. See below.

```ts
import { IPageInfo } from '@tt-tech/ngx-virtual-scroller';
...

@Component({
    selector: 'list-with-api',
    template: `
        <virtual-scroller #scroll [items]="buffer" (vsEnd)="fetchMore($event)">
            <my-custom-component *ngFor="let item of scroll.viewPortItems"> </my-custom-component>
            <div *ngIf="loading" class="loader">Loading...</div>
        </virtual-scroller>
    `
})
export class ListWithApiComponent implements OnChanges {

    @Input()
    items: ListItem[];

    protected buffer: ListItem[] = [];
    protected loading: boolean;

    protected fetchMore(event: IPageInfo) {
        if (event.endIndex !== this.buffer.length-1) return;
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

*Note* - The `#header` angular selector will make the `<thead>` element fixed to top. If you want the header to scroll out of view don't add the `#header` angular element ref.

```html
<virtual-scroller #scroll [items]="myItems">
    <table>
        <thead #header>
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
</virtual-scroller>
```

## If child size changes
_virtual-scroller_ caches the measurements for the rendered items. If `enableUnequalChildrenSizes===true` then each item is measured and cached separately. Otherwise, the 1st measured item is used for all items.

If your items can change sizes dynamically, you'll need to notify _virtual-scroller_ to re-measure them. There are 3 methods for doing this:
```ts
virtualScroller.invalidateAllCachedMeasurements();
virtualScroller.invalidateCachedMeasurementForItem(item: any);
virtualScroller.invalidateCachedMeasurementAtIndex(index: number);
```

## If child view state is reverted after scrolling away & back
_virtual-scroller_ essentially uses `*ngIf` to remove items that are scrolled out of view. This is what gives the performance benefits compared to keeping all the off-screen items in the DOM.

Because of the *ngIf, Angular completely forgets any view state. If your component has the ability to change state, it's your app's responsibility to retain that viewstate in your own object which data-binds to the component.

For example, if your child component can expand/collapse via a button, most likely scrolling away & back will cause the expansion state to revert to the default state.

To fix this, you'll need to store any "view" state properties in a variable & data-bind to it so that it can be restored when it gets removed/re-added from the DOM.

Example:
```html
<virtual-scroller #scroll [items]="items">
    <my-custom-component [expanded]="item.expanded" *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>
</virtual-scroller>
```

## If container size changes

*Note* - This should now be auto-detected, however the 'refresh' method can still force it if neeeded.

This was implemented using the `setInterval` method which may cause minor performance issues. It shouldn't be noticeable, but can be disabled via `[checkResizeInterval]="0"`

Performance will be improved once "Resize Observer" (https://wicg.github.io/ResizeObserver/) is fully implemented.

Refresh method *(DEPRECATED)*

If virtual scroll is used within a dropdown or collapsible menu, virtual scroll needs to know when the container size changes. Use `refresh()` function after container is resized (include time for animation as well).

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollerComponent } from '@tt-tech/ngx-virtual-scroller';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroller #scroll [items]="items">
            <div *ngFor="let item of scroll.viewPortItems; let i = index">
                {{i}}: {{item}}
            </div>
        </virtual-scroller>
    `
})
export class ListComponent {

    protected items = ['Item1', 'Item2', 'Item3'];

    @ViewChild(VirtualScrollerComponent)
    private virtualScroller: VirtualScrollerComponent;

    // call this function after resize + animation end
    afterResize() {
        this.virtualScroller.refresh();
    }
}
```

## Focus an item

You can use the `scrollInto()` or `scrollToIndex()` API to scroll into an item in the list:

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollerComponent } from '@tt-tech/ngx-virtual-scroller';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroller #scroll [items]="items">
            <div *ngFor="let item of scroll.viewPortItems; let i = index">
                {{i}}: {{item}}
            </div>
        </virtual-scroller>
    `
})
export class ListComponent {

    protected items = ['Item1', 'Item2', 'Item3'];

    @ViewChild(VirtualScrollerComponent)
    private virtualScroller: VirtualScrollerComponent;

    // call this function whenever you have to focus on second item
    focusOnAnItem() {
        this.virtualScroller.items = this.items;
        this.virtualScroller.scrollInto(items[1]);
    }
}
```

## Dependency Injection of configuration settings

Some default config settings can be overridden via DI, so you can set them globally instead of on each instance of _virtual-scroller_.

```ts
providers: [
    provide: 'virtual-scroller-default-options', useValue: {
        checkResizeInterval: 1000,
        modifyOverflowStyleOfParentScroll: true,
        resizeBypassRefreshThreshold: 5,
        scrollAnimationTime: 750,
        scrollDebounceTime: 0,
        scrollThrottlingTime: 0,
        stripedTable: false
    }
],
```

OR

```ts
export function vsDefaultOptionsFactory(): VirtualScrollerDefaultOptions {
    return {
        checkResizeInterval: 1000,
        modifyOverflowStyleOfParentScroll: true,
        resizeBypassRefreshThreshold: 5,
        scrollAnimationTime: 750,
        scrollDebounceTime: 0,
        scrollThrottlingTime: 0,
        stripedTable: false
    };
}

providers: [
    provide: 'virtual-scroller-default-options', useFactory: vsDefaultOptionsFactory
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
```scss
    // hide vertical scrollbar
    margin-right: -25px;
    padding-right: 25px;

    // hide horizontal scrollbar
    margin-bottom: -25px;
    padding-bottom: 25px;
```

## Additional elements in scroll

If you want to nest additional elements inside virtual scroll besides the list itself (e.g. search field), you need to wrap those elements in a tag with an angular selector name of `#container`.

```html
<virtual-scroller #scroll [items]="items">
    <input type="search">
    <div #container>
        <my-custom-component *ngFor="let item of scroll.viewPortItems">
        </my-custom-component>
    </div>
</virtual-scroller>
```

## Performance - TrackBy

_virtual-scroller_ uses `*ngFor` to render the visible items. When an `*ngFor` array changes, Angular uses a _trackBy_ function to determine if it should re-use or re-generate each component in the loop.

For example, if 5 items are visible and scrolling causes 1 item to swap out but the other 4 remain visible, there's no reason Angular should re-generate those 4 components from scratch, it should reuse them.

A trackBy function must return either a number or string as a unique identifier for your object.

If the array used by `*ngFor` is of type `number[]` or `string[]`, Angular's default trackBy function will work automatically, you don't need to do anything extra.

If the array used by `*ngFor` is of type `any[]`, you must code your own trackBy function.

Here's an example of how to do this:

```html
<virtual-scroller #scroll [items]="myComplexItems">
    <my-custom-component
        [myComplexItem]="complexItem"
        *ngFor="let complexItem of scroll.viewPortItems; trackBy: myTrackByFunction">
    </my-custom-component>
</virtual-scroller>
```

```ts
public interface IComplexItem {
    uniqueIdentifier: number;
    extraData: any;
}

public myTrackByFunction(index: number, complexItem: IComplexItem): number {
    return complexItem.uniqueIdentifier;
}
```

## Performance - ChangeDetection

_virtual-scroller_ is coded to be extremely fast. If scrolling is slow in your app, the issue is with your custom component code, not with _virtual-scroller_ itself.
Below is an explanation of how to correct your code. This will make your entire app much faster, including _virtual-scroller_.

Each component in Angular by default uses the `ChangeDetectionStrategy.Default` "CheckAlways" strategy. This means that Change Detection cycles will be running constantly which will check *EVERY* data-binding expression on *EVERY* component to see if anything has changed.
This makes it easier for programmers to code apps, but also makes apps extremely slow.

If _virtual-scroller_ feels slow, a possible quick solution that masks the real problem is to use `scrollThrottlingTime` or `scrollDebounceTime` APIs.

The correct fix is to make cycles as fast as possible and to avoid unnecessary ChangeDetection cycles. Cycles will be faster if you avoid complex logic in data-bindings. You can avoid unnecessary Cycles by converting your components to use `ChangeDetectionStrategy.OnPush`.

ChangeDetectionStrategy.OnPush means the consuming app is taking full responsibility for telling Angular when to run change detection rather than allowing Angular to figure it out itself. For example, _virtual-scroller_ has a bound property `[items]="myItems"`. If you use OnPush, you have to tell Angular when you change the myItems array, because it won't determine this automatically.
OnPush is much harder for the programmer to code. You have to code things differently: This means
1) avoid mutating state on any bound properties where possible &
2) manually running change detection when you do mutate state.
OnPush can be done on a component-by-component basis, however I recommend doing it for *EVERY* component in your app.

If your biggest priority is making _virtual-scroller_ faster, the best candidates for _OnPush_ will be all custom components being used as children underneath _virtual-scroller_. If you have a hierarchy of multiple custom components under virtual-scroller, ALL of them need to be converted to _OnPush_.

My personal suggestion on the easiest way to implement _OnPush_ across your entire app:
```ts
import { ChangeDetectorRef } from '@angular/core';

public class ManualChangeDetection {
    public queueChangeDetection(): void {
        this.changeDetectorRef.markForCheck(); // marks self for change detection on the next cycle, but doesn't actually schedule a cycle
        this.queueApplicationTick();
    }

    public static STATIC_APPLICATION_REF: ApplicationRef;
    public static queueApplicationTick: ()=> void = Util.debounce(() => {
        if (ManualChangeDetection.STATIC_APPLICATION_REF['_runningTick']) {
            return;
        }

        ManualChangeDetection.STATIC_APPLICATION_REF.tick();
    }, 5);

    constructor(private changeDetectorRef: ChangeDetectorRef) {
    }
}

// note: this portion is only needed if you don't already have a debounce implementation in your app
public class Util {
    public static throttleTrailing(func: Function, wait: number): Function {
        let timeout = undefined;
        let _arguments = undefined;
        const result = function () {
            const _this = this;
            _arguments = arguments;

            if (timeout) {
                return;
            }

            if (wait <= 0) {
                func.apply(_this, _arguments);
            } else {
                timeout = setTimeout(function () {
                    timeout = undefined;
                    func.apply(_this, _arguments);
                }, wait);
            }
        };
        result['cancel'] = function () {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
        };

        return result;
    }

    public static debounce(func: Function, wait: number): Function {
        const throttled = Util.throttleTrailing(func, wait);
        const result = function () {
            throttled['cancel']();
            throttled.apply(this, arguments);
        };
        result['cancel'] = function () {
            throttled['cancel']();
        };

        return result;
    }
}

public class MyEntryLevelAppComponent
{
    constructor(applicationRef: ApplicationRef) {
        ManualChangeDetection.STATIC_APPLICATION_REF = applicationRef;
    }
}

@Component({
	...
  changeDetection: ChangeDetectionStrategy.OnPush
	...
})
public class SomeRandomComponentWhichUsesOnPush {
    private manualChangeDetection: ManualChangeDetection;
    constructor(changeDetectorRef: ChangeDetectorRef) {
        this.manualChangeDetection = new ManualChangeDetection(changeDetectorRef);
    }

    public someFunctionThatMutatesState(): void {
        this.someBoundProperty = someNewValue;

        this.manualChangeDetection.queueChangeDetection();
    }
}
```
The _ManualChangeDetection/Util_ classes are helpers that can be copy/pasted directly into your app. The code for _MyEntryLevelAppComponent_ & _SomeRandomComponentWhichUsesOnPush_ are examples that you'll need to modify for your specific app. If you follow this pattern, _OnPush_ is much easier to implement. However, the really hard part is analyzing all of your code to determine *where* you're mutating state. Unfortunately there's no magic bullet for this, you'll need to spend a lot of time reading/debugging/testing your code.

## Performance - executeRefreshOutsideAngularZone

This API is meant as a quick band-aid fix for performance issues. Please read the other performance sections above to learn the ideal way to fix performance issues.

`ChangeDetectionStrategy.OnPush` is the recommended strategy as it improves the entire app performance, not just _virtual-scroller_. However, `ChangeDetectionStrategy.OnPush` is hard to implement. `executeRefreshOutsideAngularZone` may be an easier initial approach until you're ready to tackle `ChangeDetectionStrategy.OnPush`.

If you've correctly implemented `ChangeDetectionStrategy.OnPush` for 100% of your components, the `executeRefreshOutsideAngularZone` will not provide any performance benefit.

If you have not yet done this, scrolling may feel slow. This is because Angular performs a full-app change detection while scrolling. However, it's likely that only the components inside the scroller actually need the change detection to run, so a full-app change detection cycle is overkill.

In this case you can get a free/easy performance boost with the following code:
```ts
import { ChangeDetectorRef } from '@angular/core';

public class MainComponent {
    constructor(public changeDetectorRef: ChangeDetectorRef) { }
}
```

```html
<virtual-scroller
    #scroll
    [items]="items"
    [executeRefreshOutsideAngularZone]="true"
    (vsUpdate)="changeDetectorRef.detectChanges()"
>
    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>
</virtual-scroller>
```

*Note* - `executeRefreshOutsideAngularZone` will disable Angular ChangeDetection during all _virtual-scroller_ events, including: vsUpdate, vsStart, vsEnd, vsChange. If you change any data-bound properties inside these event handlers, you must perform manual change detection on those specific components. This can be done via `changeDetectorRef.detectChanges()` at the end of the event handler.

*Note* - The `changeDetectorRef` is component-specific, so you'll need to inject it into a private variable in the constructor of the appropriate component before calling it in response to the _virtual-scroller_ events.

:warning: *WARNING* - Failure to perform manual change detection in response to _virtual-scroller_ events will cause your components to render a stale UI for a short time (until the next Change Detection cycle), which will make your app feel buggy.

*Note* - `changeDetectorRef.detectChanges()` will execute change detection on the component and all its nested children. If multiple components need to run change detection in response to a _virtual-scroller_ event, you can call detectChanges from a higher-level component in the ancestor hierarchy rather than on each individual component. However, its important to avoid too many extra change detection cycles by not going too high in the hierarchy unless all the nested children really need to have change detection performed.

*Note* - All _virtual-scroller_ events are emitted at the same time in response to its internal "refresh" function. Some of these event emitters are bypassed if certain criteria don't apply. however vsUpdate will always be emitted. For this reason, you should consolidate all data-bound property changes & manual change detection into the vsUpdate event handler, to avoid duplicate change detection cycles from executing during the other _virtual-scroller_ events.

In the above code example, `(vsUpdate)="changeDetectorRef.detectChanges()"` is necessary because `scroll.viewPortItems` was changed internally be _virtual-scroller_ during its internal "render" function before emitting (vsUpdate). `executeRefreshOutsideAngularZone` prevents _MainComponent_ from refreshing its data-binding in response to this change, so a manual Change Detection cycle must be run. No extra manual change detection code is necessary for _virtual-scroller_ or my-custom-component, even if their data-bound properties have changed, because they're nested children of _MainComponent_.

## Performance - scrollDebounceTime / scrollThrottlingTime

These APIs are meant as a quick band-aid fix for performance issues. Please read the other performance sections above to learn the ideal way to fix performance issues.

Without these set, _virtual-scroller_ will refresh immediately whenever the user scrolls.
Throttle will delay refreshing until _# milliseconds_ after scroll started. As the user continues to scroll, it will wait the same _# milliseconds_ in between each successive refresh. Even if the user stops scrolling, it will still wait the allocated time before the final refresh.
Debounce won't refresh until the user has stopped scrolling for _# milliseconds_.
If both Debounce & Throttling are set, debounce takes precedence.

*Note* - If _virtual-scroller_ hasn't refreshed & the user has scrolled past bufferAmount, no child items will be rendered and _virtual-scroller_ will appear blank. This may feel confusing to the user. You may want to have a spinner or loading message display when this occurs.

## Angular Universal / Server-Side Rendering

The initial SSR render isn't a fully functioning site, it's essentially an HTML "screenshot" (HTML/CSS, but no JS). However, it immediately swaps out your "screenshot" with the real site as soon as the full app has downloaded in the background. The intent of SSR is to give a correct visual very quickly, because a full angular app could take a long time to download. This makes the user *think* your site is fast, because hopefully they won't click on anything that requires JS before the fully-functioning site has finished loading in the background. Also, it allows screen scrapers without JavaScript to work correctly (example: Facebook posts/etc).

_virtual-scroller_ relies on JavaScript APIs to measure the size of child elements and the scrollable area of their parent. These APIs do not work in SSR because the HTML/CSS "screenshot" is generated on the server via Node, it doesn't execute/render the site as a browser would. This means _virtual-scroller_ will see all measurements as undefined and the "screenshot" will not be generated correctly. Most likely, only 1 child element will appear in your _virtual-scroller_. This "screenshot" can be fixed with polyfills. However, when the browser renders the "screenshot", the scrolling behaviour still won't work until the full app has loaded.

SSR is an advanced (and complex) topic that can't be fully addressed here. Please research this on your own. However, here are some suggestions:
1) Use https://www.npmjs.com/package/domino and https://www.npmjs.com/package/raf polyfills in your `main.server.ts` file
```ts
const domino = require('domino');
require('raf/polyfill');
const win = domino.createWindow(template);
win['versionNumber'] = 'development';
global['window'] = win;
global['document'] = win.document;
Object.defineProperty(win.document.body.style, 'transform', { value: () => { return { enumerable: true, configurable: true }; } });
```
2) Determine a default screen size you want to use for the SSR "screenshot" calculations (suggestion: 1920x1080). This won't be accurate for all users, but will hopefully be close enough. Once the full Angular app loads in the background, their real device screensize will take over.
3) Run your app in a real browser without SSR and determine the average width/height of the child elements inside _virtual-scroller_ as well as the width/height of the _virtual-scroller_ (or `[parentScroll]` element). Use these values to set the `[ssrChildWidth]`/`[ssrChildHeight]`/`[ssrViewportWidth]`/`[ssrViewportHeight]` properties.
```html
<virtual-scroller #scroll [items]="items">

    <my-custom-component
        *ngFor="let item of scroll.viewPortItems"
        [ssrChildWidth]="138"
        [ssrChildHeight]="175"
        [ssrViewportWidth]="1500"
        [ssrViewportHeight]="800"
    >
    </my-custom-component>

</virtual-scroller>
```

## Known Issues
The following are known issues that we don't know how to solve or don't have the resources to do so. Please don't submit a ticket for them. If you have an idea on how to fix them, please submit a pull request :slightly_smiling_face:

### Nested Scrollbars
If there are 2 nested scrollbars on the page the mouse scrollwheel will only affect the scrollbar of the nearest parent to the current mouse position. This means if you scroll to the bottom of a _virtual-scroller_ using the mousewheel & the window has an extra scrollbar, you cannot use the scrollwheel to scroll the page unless you move the mouse pointer out of the _virtual-scroller_ element.

## Contributing
Contributions are very welcome! Just send a pull request. Feel free to contact me or checkout my [GitHub](https://github.com/rintoj) page.

## Authors

* **Rinto Jose** (rintoj)
* **Devin Garner** (speige)
* **Pavel Kukushkin** (kykint)

## Contributers

* **TT Tech** (tt)
* **Redouane Tahoum** (R.T)
* **Mohamed Benmoussa** (M.B)

### Hope this module is helpful to you. Please make sure to checkout my other [projects](https://github.com/rintoj) and [articles](https://medium.com/@rintoj). Enjoy coding!


## Versions
[Check CHANGELOG](https://github.com/medbenmoussa/ngx-virtual-scroller/blob/master/CHANGELOG.md)

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
