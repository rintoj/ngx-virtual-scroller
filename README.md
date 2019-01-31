
# ngx-virtual-scroller

Virtual Scroll displays a virtual, "infinite" list. Supports horizontal/vertical, variable heights, & multi-column.

## Renamed from angular2-virtual-scroll to ngx-virtual-scroller. Please update your package.json

## About

This module displays a small subset of records just enough to fill the viewport and uses the same DOM elements as the user scrolls.
This method is effective because the number of DOM elements are always constant and tiny irrespective of the size of the list. Thus virtual scroll can display an infinitely growing list of items in an efficient way.

* Angular 4+ compatible module
* Supports multi-column
* Easy to use apis
* OpenSource and available in GitHub

## Breaking Changes:
* v1.0.6: viewPortIndices API property removed. (use viewPortInfo instead)
* v1.0.3: Renamed everything from virtual-scroll to virtual-scroller and from virtualScroll to virtualScroller
* v0.4.13: resizeBypassRefreshTheshold renamed to resizeBypassRefreshThreshold (typo)
* v0.4.12: The start and end values of the change/start/end events were including bufferAmount, which made them confusing. This has been corrected.
	viewPortIndices.arrayStartIndex renamed to viewPortIndices.startIndex and viewPortIndices.arrayEndIndex renamed to viewPortIndices.endIndex
* v0.4.4: The value of ChangeEvent.end wasn't intuitive. This has been corrected. Both ChangeEvent.start and ChangeEvent.end are the 0-based array indexes of the items being rendered in the viewport. (Previously Change.End was the array index + 1)

NOTE: API methods marked (DEPRECATED) will be removed in the next major version. Please attempt to stop using them in your code & create an issue if you believe they're still necessary.

## New features:

* Support for fixed <thead> on <table> elements.
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

interface ChangeEvent extends IPageInfo {
	start: number; (DEPRECATED. use startIndex instead)
	end: number; (DEPRECATED. use endIndex instead)
}
```

## API

| Attribute      | Type   | Description
|----------------|--------|------------
| checkResizeInterval | number | How often in milliseconds to check if virtual-scroller (or parentScroll) has been resized. If resized, it'll call Refresh() method. Defaults to 1000. Can be injected by DI with token "virtualScroller.checkResizeInterval".
| resizeBypassRefreshThreshold | number | How many pixels to ignore during resize check if virtual-scroller (or parentScroll) are only resized by a very small amount. Defaults to 5. Can be injected by DI with token "virtualScroller.resizeBypassRefreshThreshold".
| enableUnequalChildrenSizes | boolean | If you want to use the "unequal size" children feature. This is not perfect, but hopefully "close-enough" for most situations. Defaults to false.
| scrollDebounceTime | number | Milliseconds to delay refreshing viewport if user is scrolling quickly (for performance reasons). Default is 0. Can be injected by DI with token "virtualScroller.scrollDebounceTime".
| scrollThrottlingTime | number | Milliseconds to delay refreshing viewport if user is scrolling quickly (for performance reasons). Default is 0. Can be injected by DI with token "virtualScroller.scrollThrottlingTime".
| useMarginInsteadOfTranslate | boolean | Defaults to false. Translate is faster in many scenarios because it can use GPU acceleration, but it can be slower if your scroll container or child elements don't use any transitions or opacity. More importantly, translate creates a new "containing block" which breaks position:fixed because it'll be relative to the transform rather than the window. If you're experiencing issues with position:fixed on your child elements, turn this flag on.
| modifyOverflowStyleOfParentScroll | boolean | Defaults to true. Set to false if you want to prevent ngx-virtual-scroller from automatically changing the overflow style setting of the parentScroll element to 'scroll'. Can be injected by DI with token "virtualScroller.modifyOverflowStyleOfParentScroll"
| scrollbarWidth | number | If you want to override the auto-calculated scrollbar width. This is used to determine the dimensions of the viewable area when calculating the number of items to render. Can be injected by DI with token "virtualScroller.scrollbarWidth".
| scrollbarHeight | number | If you want to override the auto-calculated scrollbar height. This is used to determine the dimensions of the viewable area when calculating the number of items to render. Can be injected by DI with token "virtualScroller.scrollbarHeight".
| horizontal | boolean | Whether the scrollbars should be vertical or horizontal. Defaults to false.
| items          | any[]  | The data that builds the templates within the virtual scroll. This is the same data that you'd pass to ngFor. It's important to note that when this data has changed, then the entire virtual scroll is refreshed.
| stripedTable          | boolean  | Defaults to false. Set to true if you use a striped table. In this case, the rows will be added/removed two by two to keep the strips consistent. Can be injected by DI with token "virtualScroller.stripedTable"
| childWidth (DEPRECATED)     | number | The minimum width of the item template's cell. Use this if enableUnequalChildrenSizes isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)
| childHeight (DEPRECATED)    | number | The minimum height of the item template's cell. Use this if enableUnequalChildrenSizes isn't working well enough. (The actual rendered size of the first cell is used by default if not specified.)
| bufferAmount | number | The number of elements to be rendered above & below the current container's viewport. Increase this if enableUnequalChildrenSizes isn't working well enough. (defaults to enableUnequalChildrenSizes ? 5 : 0)
| scrollAnimationTime | number | The time in milliseconds for the scroll animation to run for. Default value is 750. 0 will completely disable the tween/animation. Can be injected by DI with token "virtualScroller.scrollAnimationTime".
| parentScroll   | Element / Window | Element (or window), which will have scrollbar. This element must be one of the parents of virtual-scroller
| compareItems   | Function | Predicate of syntax (item1:any, item2:any)=>boolean which is used when items array is modified to determine which items have been changed (determines if cached child size measurements need to be refreshed or not for enableUnequalChildrenSizes). Defaults to === comparison.
| start (DEPRECATED) / vsStart         | Event<ChangeEvent>  | This event is fired every time `start` index changes and emits `ChangeEvent`.
| end (DEPRECATED) / vsEnd         | Event<ChangeEvent>  | This event is fired every time `end` index changes and emits `ChangeEvent`.
| change (DEPRECATED) / vsChange         | Event<ChangeEvent>  | This event is fired every time the `start` or `end` indexes or scroll position change and emits `ChangeEvent`.
| update (DEPRECATED) / vsUpdate         | Event<any[]>  | This event is fired every time the `start` or `end` indexes change and emits the list of items which should be visible based on the current scroll position from `start` to `end`. The list emitted by this event must be used with `*ngFor` to render the actual list of items within `<virtual-scroller>`
| viewPortInfo | IPageInfo | Allows querying the the current viewport info on demand rather than listening for events.
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
| ssrViewportWidth | number | The hard-coded visible width of the virtual-scroller (or [parentScroll]) to use if rendering via Angular Universal/Server-Side-Rendering. Defaults to 1920.
| ssrViewportHeight | number | The hard-coded visible height of the virtual-scroller (or [parentScroll]) to use if rendering via Angular Universal/Server-Side-Rendering. Defaults to 1080.
| executeRefreshOutsideAngularZone | boolean | Defaults to false. This flag can provide a performance boost, but it causes side-effects related to Angular ChangeDetection that must be understood by the programmer. Strongly discouraged - this is detailed in a separate section.

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

The event `end` is fired every time the scrollbar reaches the end of the list. You could use this to dynamically load more items at the end of the scroll. See below.

```ts

import { ChangeEvent } from 'ngx-virtual-scroller';
...

@Component({
    selector: 'list-with-api',
    template: `
        <virtual-scroller [items]="buffer" (vsUpdate)="scrollItems = $event"
            (vsEnd)="fetchMore($event)">

            <my-custom-component *ngFor="let item of scrollItems"> </my-custom-component>
            <div *ngIf="loading" class="loader">Loading...</div>

        </virtual-scroller>
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
        <virtual-scroller [items]="items" (vsUpdate)="scrollList = $event">
            <div *ngFor="let item of scrollList; let i = index"> {{i}}: {{item}} </div>
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
        <virtual-scroller [items]="items" (vsUpdate)="scrollList = $event">
            <div *ngFor="let item of scrollList; let i = index"> {{i}}: {{item}} </div>
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

Some config settings can be set via DI, so you can set them globally instead of on each instance of virtual-scroller.

```ts
 providers: [
    {  provide: 'virtualScroller.scrollThrottlingTime', useValue: 0  },
    {  provide: 'virtualScroller.scrollDebounceTime', useValue: 0  },
    {  provide: 'virtualScroller.scrollAnimationTime', useValue: 750  },
	{  provide: 'virtualScroller.scrollbarWidth', useValue: undefined  },
	{  provide: 'virtualScroller.scrollbarHeight', useValue: undefined  },
	{  provide: 'virtualScroller.checkResizeInterval', useValue: 1000  },
	{  provide: 'virtualScroller.resizeBypassRefreshThreshold', useValue: 5  }
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

## Performance (and the executeRefreshOutsideAngularZone flag)

Each component in Angular by default uses the ChangeDetectionStrategy.Default "CheckAlways" strategy. This means that Change Detection cycles will run frequently and will check *EVERY* data-binding expression on *EVERY* component to see if anything has changed. This makes it easier for programmers to code apps, but also makes apps slow. For simple apps it may not be noticed, but as apps become more complex it quickly becomes apparent. The correct way to fix this is to make cycles as fast as possible and to avoid unnecessary ChangeDetection cycles. Cycles will be faster if you avoid complex business logic in data-bindings. You can avoid unnecessary Cycles by converting your components to use ChangeDetectionStrategy.OnPush. When doing this, you have to explicitly tell Angular when you're modifying the value of a data-binding expression, because it will not be checked automatically. This topic can be researched online, there are a lot of detailed articles about it.

virtual-scroller causes a full ChangeDetection cycle to run during every refresh (scrolling/etc). This is standard practice for all Angular components/libraries. If you have an app that is usually fast, but becomes slow while scrolling virtual-scroller, the correct solution is to convert all of your components to use ChangeDetectionStrategy.OnPush. However, this may not be easy. If you want a quick solution that masks the real problem, you can use the scrollThrottlingTime, scrollDebounceTime, or executeRefreshOutsideAngularZone APIs.

The executeRefreshOutsideAngularZone is strongly discouraged because it disables Angular's automatic Change Detection from any code paths started by virtual-scroller. This essentially randomly converts some of your app's components to use ChangeDetectionStrategy.OnPush without you explicitly choosing to do so. Because this wasn't an intentional choice, you won't have code to tell Angular when those components need to re-bind their UI, which will cause the DOM to not update when it should. These UI bugs won't be consistent, because it'll depend on which code path caused your data-binding model to change. The list of potential code paths in virtual-scroller is too long to make an exhaustive list & which of your components are affected is completely dependent on what business logic you execute in response to those virtual-scroller code paths. If you choose to use this flag, it's your responsibility to do extensive testing in your app and to thoroughly read and understand the virtual-scroller source code. You probably should not make this choice unless you have a strong understanding of Angular's ChangeDetection internals.

Although use of the executeRefreshOutsideAngularZone flag is strongly discouraged, it is up to the consuming app's programmer to determine if it's the right decision for their application.

If you're lucky, you can implement this flag as follows and get a free speed boost while scrolling:
```ts
//parent.component.ts
constructor (public changeDetectorRef: ChangeDetectorRef) { }
```

```html
<!-- parent.component.html -->
<virtual-scroller #scroll [items]="items" [executeRefreshOutsideAngularZone]="true" (vsUpdate)="changeDetectorRef.detectChanges();">
    <my-custom-component *ngFor="let item of scroll.viewPortItems">
    </my-custom-component>
</virtual-scroller>
```

If you're unlucky, this will cause a bunch of UI bugs because you've disabled Angular's change detection for any code path started by virtual-scroller. In these cases, you'll have to track down & fix each bug separately (usually by adding `changeDetectorRef.detectChanges()`). These bugs might continue to crop up in the future as you make minor code changes. In the end, you might decide to stop using the buggy flag & instead do the correct fix which is to switch all your components to using ChangeDetectionStrategy.OnPush (which requires you to also explicitly tell Angular any time you change your data-model so Angular knows to re-bind).

## Angular OnPush Detection Strategy - General performance advice (not specific to ngx-virtual-scroller)
The default ChangeDetectionStrategy implemented by Angular monitors your entire app for code that *might* change state. If something triggers change detection, Angular recursively checks every component in your app to see if any of them need to be re-rendered. It determines this by comparing the old/new value of each bound property to see if anything has changed. This is helpful to the programmer because it's easy & it works like magic. If you change something, it displays on the screen. However, it's extremely slow. The default ChangeDetectionStrategy is really intented for quick-start apps. Once an application gets complex enough, it'll almost be mandatory to convert it to the OnPush strategy otherwise performance will grind to a halt.

For example, virtual-scroller has a bound property [items]="items". If you use OnPush, you have to tell Angular if you change the items array, because it won't re-render automatically. With the default ChangeDetectionStrategy, this is handled automatically (but, the default ChangeDetectionStrategy is slow because it re-binds/re-renders extra times unnecessarily). 

OnPush means the consuming app is taking full responsibility for telling Angular when to run change detection rather than allowing Angular to figure it out itself. This is much faster, however it's also much harder for the programmer to code. You have to code things differently: This means 1) avoid mutating state on any bound properties where possible & 2) manually running change detection when you do mutate state. OnPush can be done on a component-by-component basis, however if you really need speed, I recommend doing it for *EVERY* component in your app.

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
	}, 50);
	
	constructor(private changeDetectorRef: ChangeDetectorRef) {
	}
}  

//note: this portion is only needed if you don't already have a debounce implementation in your app
public class Util {
	public static throttleTrailing(func: Function, wait: number): Function {
		let timeout = undefined;
		const result = function () {
			const _this = this;
			const _arguments = arguments;

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


## scrollDebounceTime / scrollThrottlingTime (for performance reasons)

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
