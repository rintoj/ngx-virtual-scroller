
# ngx-virtual-scroller

Virtual Scroll displays a virtual, "infinite" list. Supports horizontal/vertical, variable heights, & multi-column.

## Renamed from angular2-virtual-scroll to ngx-virtual-scroller. Please update your package.json

## About

This module displays a small subset of records just enough to fill the viewport and uses the same DOM elements as the user scrolls.
This method is effective because the number of DOM elements are always constant and tiny irrespective of the size of the list. Thus virtual scroll can display an infinitely growing list of items in an efficient way.

* Supports multi-column
* Easy to use apis
* OpenSource and available in GitHub

## Breaking Changes:
* v3.0.0: Several deprecated properties removed (see changelog).
	If items array is prepended with additional items, keep scroll on currently visible items, if possible. There is no flag to disable this, because it seems to be the best user-experience in all cases. If you disagree, please create an issue.
* v2.1.0: Dependency Injection syntax was changed.
* v1.0.6: viewPortIndices API property removed. (use viewPortInfo instead)
* v1.0.3: Renamed everything from virtual-scroll to virtual-scroller and from virtualScroll to virtualScroller
* v0.4.13: resizeBypassRefreshTheshold renamed to resizeBypassRefreshThreshold (typo)
* v0.4.12: The start and end values of the change/start/end events were including bufferAmount, which made them confusing. This has been corrected.
	viewPortIndices.arrayStartIndex renamed to viewPortIndices.startIndex and viewPortIndices.arrayEndIndex renamed to viewPortIndices.endIndex
* v0.4.4: The value of IPageInfo.endIndex wasn't intuitive. This has been corrected. Both IPageInfo.startIndex and IPageInfo.endIndex are the 0-based array indexes of the items being rendered in the viewport. (Previously Change.EndIndex was the array index + 1)

NOTE: API methods marked (DEPRECATED) will be removed in the next major version. Please attempt to stop using them in your code & create an issue if you believe they're still necessary.

## New features:

* Support for fixed <thead> on <table> elements.
* Added API to query for current scroll px position (also passed as argument to IPageInfo listeners)
* Added API to invalidate cached child item measurements (if your child item sizes change dynamically)
* Added API to scroll to specific px position
* If scroll container resizes, the items will auto-refresh. Can be disabled if it causes any performance issues by setting [checkResizeInterval]="0"
* useMarginInsteadOfTranslate flag. Defaults to false. This can affect performance (better/worse depending on your circumstances), and also creates a workaround for the transform+position:fixed browser bug.
* Support for horizontal scrollbars
* Support for elements with different sizes
* Added ability to put other elements inside of scroll (Need to wrap list itself in @ContentChild('container'))
* Added ability to use any parent with scrollbar instead of this element (@Input() parentScroll)
 
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

**Step 1:** Install ngx-virtual-scroller

```sh
npm install ngx-virtual-scroller --save
```

**Step 2:** Import virtual scroll module into your app module

```ts
....
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

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

**Step 3:** Wrap virtual-scroller tag around elements;

```ts
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

**Step 4:** Create 'my-custom-component' component.

'my-custom-component' must be a custom angular2 component, outside of this library.

Child component is not necessary if your item is simple enough. See below.

```html
<virtual-scroller #scroll [items]="items">
    <div *ngFor="let item of scroll.viewPortItems">{{item?.name}}</div>
</virtual-scroller>
```

## Interfaces
```
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

| Attribute      | Type   | Description
|----------------|--------|------------
| checkResizeInterval | number | How often in milliseconds to check if virtual-scroller (or parentScroll) has been resized. If resized, it'll call Refresh() method. Defaults to 1000.
| resizeBypassRefreshThreshold | number | How many pixels to ignore during resize check if virtual-scroller (or parentScroll) are only resized by a very small amount. Defaults to 5.
| enableUnequalChildrenSizes | boolean | If you want to use the "unequal size" children feature. This is not perfect, but hopefully "close-enough" for most situations. Defaults to false.
| scrollDebounceTime | number | Milliseconds to delay refreshing viewport if user is scrolling quickly (for performance reasons). Default is 0.
| scrollThrottlingTime | number | Milliseconds to delay refreshing viewport if user is scrolling quickly (for performance reasons). Default is 0.
| useMarginInsteadOfTranslate | boolean | Defaults to false. Translate is faster in many scenarios because it can use GPU acceleration, but it can be slower if your scroll container or child elements don't use any transitions or opacity. More importantly, translate creates a new "containing block" which breaks position:fixed because it'll be relative to the transform rather than the window. If you're experiencing issues with position:fixed on your child elements, turn this flag on.
| modifyOverflowStyleOfParentScroll | boolean | Defaults to true. Set to false if you want to prevent ngx-virtual-scroller from automatically changing the overflow style setting of the parentScroll element to 'scroll'.
| scrollbarWidth | number | If you want to override the auto-calculated scrollbar width. This is used to determine the dimensions of the viewable area when calculating the number of items to render.
| scrollbarHeight | number | If you want to override the auto-calculated scrollbar height. This is used to determine the dimensions of the viewable area when calculating the number of items to render.
| horizontal | boolean | Whether the scrollbars should be vertical or horizontal. Defaults to false.
| items          | any[]  | The data that builds the templates within the virtual scroll. This is the same data that you'd pass to ngFor. It's important to note that when this data has changed, then the entire virtual scroll is refreshed.
| stripedTable          | boolean  | Defaults to false. Set to true if you use a striped table. In this case, the rows will be added/removed two by two to keep the strips consistent.
| childWidth (DEPRECATED)     | number | The minimum width of the item template's cell. Use this if enableUnequalChildrenSizes isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)
| childHeight (DEPRECATED)    | number | The minimum height of the item template's cell. Use this if enableUnequalChildrenSizes isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)
| bufferAmount | number | The number of elements to be rendered above & below the current container's viewport. Increase this if enableUnequalChildrenSizes isn't working well enough. (defaults to enableUnequalChildrenSizes ? 5 : 0)
| scrollAnimationTime | number | The time in milliseconds for the scroll animation to run for. Default value is 750. 0 will completely disable the tween/animation.
| parentScroll   | Element / Window | Element (or window), which will have scrollbar. This element must be one of the parents of virtual-scroller
| compareItems   | Function | Predicate of syntax (item1:any, item2:any)=>boolean which is used when items array is modified to determine which items have been changed (determines if cached child size measurements need to be refreshed or not for enableUnequalChildrenSizes). Defaults to === comparison.
| vsStart         | Event<IPageInfo>  | This event is fired every time `start` index changes and emits `IPageInfo`.
| vsEnd         | Event<IPageInfo>  | This event is fired every time `end` index changes and emits `IPageInfo`.
| vsChange         | Event<IPageInfo>  | This event is fired every time the `start` or `end` indexes or scroll position change and emits `IPageInfo`.
| vsUpdate         | Event<any[]>  | This event is fired every time the `start` or `end` indexes change and emits the list of items which should be visible based on the current scroll position from `start` to `end`. The list emitted by this event must be used with `*ngFor` to render the actual list of items within `<virtual-scroller>`
| viewPortInfo | IPageInfo | Allows querying the the current viewport info on demand rather than listening for events.
| viewPortItems | any[] | The array of items currently being rendered to the viewport.
| refresh | ()=>void | Function to force re-rendering of current items in viewport.
| invalidateAllCachedMeasurements | ()=>void | Function to force re-measuring *all* cached item sizes. If enableUnequalChildrenSizes===false, only 1 item will be re-measured.
| invalidateCachedMeasurementForItem | (item:any)=>void | Function to force re-measuring cached item size.
| invalidateCachedMeasurementAtIndex | (index:number)=>void | Function to force re-measuring cached item size.
| scrollInto | (item:any, alignToBeginning:boolean = true, additionalOffset:number = 0, animationMilliseconds:number = undefined, animationCompletedCallback:()=>void = undefined)=>void | Scrolls to item
| scrollToIndex | (index:number, alignToBeginning:boolean = true, additionalOffset:number = 0, animationMilliseconds:number = undefined, animationCompletedCallback:()=>void = undefined)=>void | Scrolls to item at index
| scrollToPosition | (scrollPosition:number, animationMilliseconds:number = undefined, animationCompletedCallback: ()=>void = undefined)=>void | Scrolls to px position
| ssrChildWidth | number | The hard-coded width of the item template's cell to use if rendering via Angular Universal/Server-Side-Rendering
| ssrChildHeight | number | The hard-coded height of the item template's cell to use if rendering via Angular Universal/Server-Side-Rendering
| ssrViewportWidth | number | The hard-coded visible width of the virtual-scroller (or [parentScroll]) to use if rendering via Angular Universal/Server-Side-Rendering. Defaults to 1920.
| ssrViewportHeight | number | The hard-coded visible height of the virtual-scroller (or [parentScroll]) to use if rendering via Angular Universal/Server-Side-Rendering. Defaults to 1080.
| executeRefreshOutsideAngularZone (deprecated) | boolean | Defaults to false. DO NOT USE. This flag disables Angular ChangeDetection while scrolling (which provides a performance boost at the expense of making your app buggy). Read the "Performance" section below to learn a better approach.

Note: The Events without the "vs" prefix have been deprecated because they might conflict with native DOM events due to their "bubbling" nature. See https://github.com/angular/angular/issues/13997
An example is if an <input> element inside <virtual-scroller> emits a "change" event which bubbles up to the (change) handler of virtual-scroller. Using the vs prefix will prevent this bubbling conflict because there are currently no official DOM events prefixed with vs.

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

If the parentScroll is a custom angular component (instead of a native HTML element such as DIV), Angular will wrap the #scrollingBlock variable in an ElementRef https://angular.io/api/core/ElementRef in which case you'll need to use the .nativeElement property to get to the underlying javascript DOM element reference.

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

Note: The parent element should have a width and height defined.

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

Items must have fixed height and width for this module to work perfectly. If not, set [enableUnequalChildrenSizes]="true".

(DEPRECATED): If enableUnequalChildrenSizes isn't working, you can set inputs `childWidth` and `childHeight` to their smallest possible values. You can also modify `bufferAmount` which causes extra items to be rendered on the edges of the scrolling area.

```html
<virtual-scroller #scroll [items]="items" [enableUnequalChildrenSizes]="true">

    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>

</virtual-scroller>
```

## Loading in chunks

The event `vsEnd` is fired every time the scrollbar reaches the end of the list. You could use this to dynamically load more items at the end of the scroll. See below.

```ts

import { IPageInfo } from 'ngx-virtual-scroller';
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

Note: The #header angular selector will make the <thead> element fixed to top. If you want the header to scroll out of view don't add the #header angular element ref.

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
virtual-scroller caches the measurements for the rendered items. If enableUnequalChildrenSizes===true then each item is measured and cached separately. Otherwise, the 1st measured item is used for all items.
If your items can change sizes dynamically, you'll need to notify virtual-scroller to re-measure them. There are 3 methods for doing this:
```ts
virtualScroller.invalidateAllCachedMeasurements();
virtualScroller.invalidateCachedMeasurementForItem(item: any);
virtualScroller.invalidateCachedMeasurementAtIndex(index: number);
```

## If child view state is reverted after scrolling away & back 
virtual-scroller essentially uses *ngIf to remove items that are scrolled out of view. This is what gives the performance benefits compared to keeping all the off-screen items in the DOM.

Because of the *ngIf, Angular completely forgets any view state. If your component has the ability to change state, it's your app's responsibility to retain that viewstate in your own object which data-binds to the component.

For example, if your child component can expand/collapse via a button, most likely scrolling away & back will cause the expansion state to revert to the default state.

To fix this, you'll need to store any "view" state properties in a variable & data-bind to it so that it can be restored when it gets removed/re-added from the DOM.

Example:
```
<virtual-scroller #scroll [items]="items">
    <my-custom-component [expanded]="item.expanded" *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>
</virtual-scroller>
```

## If container size changes

Note: This should now be auto-detected, however the 'refresh' method can still force it if neeeded.
	This was implemented using the setInterval method which may cause minor performance issues. It shouldn't be noticeable, but can be disabled via [checkResizeInterval]="0"
	Performance will be improved once "Resize Observer" (https://wicg.github.io/ResizeObserver/) is fully implemented.

Refresh method (DEPRECATED)
If virtual scroll is used within a dropdown or collapsible menu, virtual scroll needs to know when the container size changes. Use `refresh()` function after container is resized (include time for animation as well).

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroller #scroll [items]="items">
            <div *ngFor="let item of scroll.viewPortItems; let i = index"> {{i}}: {{item}} </div>
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

You can use the `scrollInto(item, alignToBeginning?, additionalOffset?, animationMilliseconds?, animationCompletedCallback?)` api to scroll into an item in the list.
You can also use the `scrollToIndex(index, alignToBeginning?, additionalOffset?, animationMilliseconds?, animationCompletedCallback?)` api for the same purpose.
See below:

```ts
import { Component, ViewChild } from '@angular/core';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';

@Component({
    selector: 'rj-list',
    template: `
        <virtual-scroller #scroll [items]="items">
            <div *ngFor="let item of scroll.viewPortItems; let i = index"> {{i}}: {{item}} </div>
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

Some default config settings can be overridden via DI, so you can set them globally instead of on each instance of virtual-scroller.

```ts
 providers: [
		provide: 'virtual-scroller-default-options', useValue: {
			scrollThrottlingTime: 0,
			scrollDebounceTime: 0,
			scrollAnimationTime: 750,
			checkResizeInterval: 1000,
			resizeBypassRefreshThreshold: 5,
			modifyOverflowStyleOfParentScroll: true,
			stripedTable: false
		}
  ],
```

OR

```ts
export function vsDefaultOptionsFactory(): VirtualScrollerDefaultOptions {
	return {
		scrollThrottlingTime: 0,
		scrollDebounceTime: 0,
		scrollAnimationTime: 750,
		checkResizeInterval: 1000,
		resizeBypassRefreshThreshold: 5,
		modifyOverflowStyleOfParentScroll: true,
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
```css
	//hide vertical scrollbar
	   margin-right: -25px;
	   padding-right: 25px;
	
	//hide horizontal scrollbar
	   margin-bottom: -25px;
	   padding-bottom: 25px;
```

## Additional elements in scroll

If you want to nest additional elements inside virtual scroll besides the list itself (e.g. search field), you need to wrap those elements in a tag with an angular selector name of #container.

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

virtual-scroller uses *ngFor to render the visible items. When an *ngFor array changes, Angular uses a trackBy function to determine if it should re-use or re-generate each component in the loop.
For example, if 5 items are visible and scrolling causes 1 item to swap out but the other 4 remain visible, there's no reason Angular should re-generate those 4 components from scratch, it should reuse them.
A trackBy function must return either a number or string as a unique identifier for your object. 
If the array used by *ngFor is of type number[] or string[], Angular's default trackBy function will work automatically, you don't need to do anything extra.
If the array used by *ngFor is of type any[], you must code your own trackBy function.

Here's an example of how to do this:

```html
<virtual-scroller #scroll [items]="myComplexItems">
	<my-custom-component [myComplexItem]="complexItem" *ngFor="let complexItem of scroll.viewPortItems; trackBy: myTrackByFunction">
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

virtual-scroller is coded to be extremely fast. If scrolling is slow in your app, the issue is with your custom component code, not with virtual-scroller itself.
Below is an explanation of how to correct your code. This will make your entire app much faster, including virtual-scroller.

Each component in Angular by default uses the ChangeDetectionStrategy.Default "CheckAlways" strategy. This means that Change Detection cycles will be running constantly which will check *EVERY* data-binding expression on *EVERY* component to see if anything has changed.
This makes it easier for programmers to code apps, but also makes apps extremely slow.

If virtual-scroller feels slow, a possible quick solution that masks the real problem is to use scrollThrottlingTime or scrollDebounceTime APIs.

The correct fix is to make cycles as fast as possible and to avoid unnecessary ChangeDetection cycles. Cycles will be faster if you avoid complex logic in data-bindings. You can avoid unnecessary Cycles by converting your components to use ChangeDetectionStrategy.OnPush.

ChangeDetectionStrategy.OnPush means the consuming app is taking full responsibility for telling Angular when to run change detection rather than allowing Angular to figure it out itself. For example, virtual-scroller has a bound property [items]="myItems". If you use OnPush, you have to tell Angular when you change the myItems array, because it won't determine this automatically.
OnPush is much harder for the programmer to code. You have to code things differently: This means 1) avoid mutating state on any bound properties where possible & 2) manually running change detection when you do mutate state.
OnPush can be done on a component-by-component basis, however I recommend doing it for *EVERY* component in your app.

If your biggest priority is making virtual-scroller faster, the best candidates for OnPush will be all custom components being used as children underneath virtual-scroller. If you have a hierarchy of multiple custom components under virtual-scroller, ALL of them need to be converted to OnPush.

My personal suggestion on the easiest way to implement OnPush across your entire app:
```
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

//note: this portion is only needed if you don't already have a debounce implementation in your app
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
The ManualChangeDetection/Util classes are helpers that can be copy/pasted directly into your app. The code for MyEntryLevelAppComponent & SomeRandomComponentWhichUsesOnPush are examples that you'll need to modify for your specific app. If you follow this pattern, OnPush is much easier to implement. However, the really hard part is analyzing all of your code to determine *where* you're mutating state. Unfortunately there's no magic bullet for this, you'll need to spend a lot of time reading/debugging/testing your code.


## Performance - scrollDebounceTime / scrollThrottlingTime

These APIs are meant as a quick band-aid fix for performance issues. Please read the other performance sections above to learn the correct way to fix performance issues.

Without these set, virtual-scroller will refresh immediately whenever the user scrolls.
Throttle will delay refreshing until # milliseconds after scroll started. As the user continues to scroll, it will wait the same # milliseconds in between each successive refresh. Even if the user stops scrolling, it will still wait the allocated time before the final refresh.
Debounce won't refresh until the user has stopped scrolling for # milliseconds.
If both Debounce & Throttling are set, debounce takes precedence.
Note: If virtual-scroller hasn't refreshed & the user has scrolled past bufferAmount, no child items will be rendered and virtual-scroller will appear blank. This may feel confusing to the user. You may want to have a spinner or loading message display when this occurs.

## Angular Universal / Server-Side Rendering

The initial SSR render isn't a fully functioning site, it's essentially an HTML "screenshot" (HTML/CSS, but no JS). However, it immediately swaps out your "screenshot" with the real site as soon as the full app has downloaded in the background. The intent of SSR is to give a correct visual very quickly, because a full angular app could take a long time to download. This makes the user *think* your site is fast, because hopefully they won't click on anything that requires JS before the fully-functioning site has finished loading in the background. Also, it allows screen scrapers without javascript to work correctly (example: Facebook posts/etc).
virtual-scroller relies on javascript APIs to measure the size of child elements and the scrollable area of their parent. These APIs do not work in SSR because the HTML/CSS "screenshot" is generated on the server via Node, it doesn't execute/render the site as a browser would. This means virtual-scroller will see all measurements as undefined and the "screenshot" will not be generated correctly. Most likely, only 1 child element will appear in your virtual-scroller. This "screenshot" can be fixed with polyfills. However, when the browser renders the "screenshot", the scrolling behaviour still won't work until the full app has loaded.

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
3) Run your app in a real browser without SSR and determine the average width/height of the child elements inside virtual-scroller as well as the width/height of the virtual-scroller (or [parentScroll] element). Use these values to set the [ssrChildWidth]/[ssrChildHeight]/[ssrViewportWidth]/[ssrViewportHeight] properties.
```
<virtual-scroller #scroll [items]="items">

    <my-custom-component *ngFor="let item of scroll.viewPortItems" [ssrChildWidth]="138" [ssrChildHeight]="175" [ssrViewportWidth]="1500" [ssrViewportHeight]="800">
    </my-custom-component>

</virtual-scroller>
```

## Known Issues
The following are known issues that we don't know how to solve or don't have the resources to do so. Please don't submit a ticket for them. If you have an idea on how to fix them, please submit a pull request :)

### Nested Scrollbars
If there are 2 nested scrollbars on the page the mouse scrollwheel will only affect the scrollbar of the nearest parent to the current mouse position. This means if you scroll to the bottom of a virtual-scroller using the mousewheel & the window has an extra scrollbar, you cannot use the scrollwheel to scroll the page unless you move the mouse pointer out of the virtual-scroller element.

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
[Check CHANGELOG](https://github.com/rintoj/ngx-virtual-scroller/blob/master/CHANGELOG.md)

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
