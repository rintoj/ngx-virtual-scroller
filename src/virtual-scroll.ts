import {
	Component,
	ContentChild,
	ElementRef,
	EventEmitter,
	Input,
	NgModule,
	NgZone,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	Renderer2,
	SimpleChanges,
	ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import * as tween from '@tweenjs/tween.js'

export interface ChangeEvent {
	start?: number;
	end?: number;
}

@Component({
	selector: 'virtual-scroll,[virtualScroll]',
	exportAs: 'virtualScroll',
	template: `
    <div class="total-padding" #shim></div>
    <div class="scrollable-content" #content>
      <ng-content></ng-content>
    </div>
  `,
	host: {
		'[class.horizontal]': "horizontal",
		'[class.vertical]': "!horizontal",
		'[class.selfScroll]': "!parentScroll"
	},
	styles: [`
    :host {
      position: relative;
	  display: block;
      -webkit-overflow-scrolling: touch;
    }
	
	:host.horizontal.selfScroll {
      overflow-y: visible;
      overflow-x: auto;
	}
	:host.vertical.selfScroll {
      overflow-y: auto;
      overflow-x: visible;
	}
	
    .scrollable-content {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
    }
	
	:host.horizontal {
		white-space: nowrap;
	}
	
	:host.horizontal .scrollable-content ::ng-deep > * {
		white-space: initial;
	}
	
    .total-padding {
      width: 1px;
      opacity: 0;
    }
    
    :host.horizontal .total-padding {
      height: 100%;
    }
  `]
})
export class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {

	private calculatedScrollbarWidth: number = 0;
	private calculatedScrollbarHeight: number = 0;

	@Input()
	scrollbarWidth: number;

	@Input()
	scrollbarHeight: number;

	@Input()
	childWidth: number;

	@Input()
	childHeight: number;

	@Input()
	bufferAmount: number = 0;

	@Input()
	scrollAnimationTime: number = 750;

	protected _items: any[] = [];
	@Input()
	set items(items: any[]) {
		if (items === this._items) {
			return;
		}
		this._items = items || [];
		this.refresh();
	}

	get items(): any[] {
		return this._items;
	}

	protected _horizontal: boolean;
	protected _offsetType;
	protected _scrollType;
	protected _pageOffsetType;
	protected _scrollDim;
	protected _itemsPerScrollDir;
	protected _itemsPerOpScrollDir;
	protected _childScrollDim;
	protected _translateDir;
	@Input() set horizontal(value: boolean) {
		this._horizontal = value;
		this.updateDirection();
	}
	get horizontal(): boolean {
		return this._horizontal;
	}

	protected updateDirection(): void {
		if (this.horizontal) {
			this._offsetType = 'offsetLeft';
			this._pageOffsetType = 'pageXOffset';
			this._scrollDim = 'scrollWidth';
			this._itemsPerScrollDir = 'itemsPerRow';
			this._itemsPerOpScrollDir = 'itemsPerCol';
			this._childScrollDim = 'childWidth';
			this._translateDir = 'translateX';
			this._scrollType = 'scrollLeft';
		}
		else {
			this._offsetType = 'offsetTop';
			this._pageOffsetType = 'pageYOffset';
			this._scrollDim = 'scrollHeight';
			this._itemsPerScrollDir = 'itemsPerCol';
			this._itemsPerOpScrollDir = 'itemsPerRow';
			this._childScrollDim = 'childHeight';
			this._translateDir = 'translateY';
			this._scrollType = 'scrollTop';
		}
	}

	protected refreshHandler = () => {
		this.refresh();
	};
	protected _parentScroll: Element | Window;
	@Input()
	set parentScroll(element: Element | Window) {
		if (this._parentScroll === element) {
			return;
		}

		this._parentScroll = element;
		this.addScrollEventHandlers();

		let scrollElement = this.getScrollElement();
		if (scrollElement !== this.element.nativeElement) {
			scrollElement.style['overflow-y'] = this.horizontal ? 'visible' : 'auto';
			scrollElement.style['overflow-x'] = this.horizontal ? 'auto' : 'visible';
		}
	}

	get parentScroll(): Element | Window {
		return this._parentScroll;
	}

	@Output()
	update: EventEmitter<any[]> = new EventEmitter<any[]>();
	viewPortItems: any[];

	@Output()
	change: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@Output()
	start: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@Output()
	end: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@ViewChild('content', { read: ElementRef })
	contentElementRef: ElementRef;

	@ViewChild('shim', { read: ElementRef })
	shimElementRef: ElementRef;

	@ContentChild('container', { read: ElementRef })
	containerElementRef: ElementRef;

	padding: number = 0;
	previousStart: number = 0;
	previousEnd: number = -1;
	previousPageSize: number = 0;
	previousScrollNumberElements: number = 0;
	startupLoop: boolean = true;
	currentTween: tween.Tween;
	itemsHeight: { [key: number]: number } = {};
	itemsWidth: { [key: number]: number } = {};
	itemsLength: number;

	public window = window;

	protected disposeScrollHandler: () => void | undefined;
	protected disposeResizeHandler: () => void | undefined;

	/** Cache of the last scroll to prevent setting CSS when not needed. */
	protected lastScrollHeight = -1;
	protected lastScrollWidth = -1;

	/** Cache of the last top padding to prevent setting CSS when not needed. */
	protected lastPadding = -1;


	constructor(
		protected readonly element: ElementRef,
		protected readonly renderer: Renderer2,
		protected readonly zone: NgZone) {
		this.horizontal = false;
	}

	ngOnInit() {
		this.addScrollEventHandlers();
	}

	ngOnDestroy() {
		this.removeScrollEventHandlers();
	}

	ngOnChanges(changes: any) {
		this.previousStart = 0;
		this.previousEnd = -1;
		const hadPreviousValue: boolean = changes.items && changes.items.previousValue && changes.items.previousValue.length > 0;
		if (!hadPreviousValue) {
			this.startupLoop = true;
			this.itemsLength = this.items.length;
		}
		this.refresh();
	}

	ngDoCheck() {
		if (this.items && this.itemsLength !== this.items.length) {
			this.previousStart = 0;
			this.previousEnd = -1;
			this.startupLoop = true;
			this.refresh();
			this.itemsLength = this.items.length;
		}
	}

	refresh(forceViewportUpdate: boolean = false) {
		this.zone.runOutsideAngular(() => {
			requestAnimationFrame(() => this.calculateItems(forceViewportUpdate));
		});
	}

	protected getScrollElement(): HTMLElement {
		return this.parentScroll instanceof Window ? document.scrollingElement || document.documentElement || document.body : this.parentScroll || this.element.nativeElement;
	}

	scrollInto(item: any, additionalOffset: number = 0) {
		let el = this.getScrollElement();
		let offset = this.getElementsOffset();
		let index: number = (this.items || []).indexOf(item);
		if (index < 0 || index >= (this.items || []).length) return;

		let d = this.calculateDimensions();
		let scroll = ((Math.floor(index / d[this._itemsPerOpScrollDir]) - Math.min(index, this.bufferAmount)) * d[this._childScrollDim]) + offset + additionalOffset;

		let animationRequest: number;

		if (this.currentTween) {
			this.currentTween.stop();
			this.currentTween = undefined;
		}

		// totally disable animate
		if (!this.scrollAnimationTime) {
			el[this._scrollType] = scroll;
			return;
		}

		const tweenConfigObj = { scroll: el[this._scrollType] };

		let newTween = new tween.Tween(tweenConfigObj)
			.to({ scroll }, this.scrollAnimationTime)
			.easing(tween.Easing.Quadratic.Out)
			.onUpdate((data) => {
				if (isNaN(data.scroll)) {
					return;
				}
				this.renderer.setProperty(el, this._scrollType, data.scroll);
				this.refresh();
			})
			.onStop(() => {
				cancelAnimationFrame(animationRequest);
			})
			.start();

		const animate = (time?: number) => {
			newTween.update(time);
			if (tweenConfigObj.scroll !== scroll) {
				this.zone.runOutsideAngular(() => {
					animationRequest = requestAnimationFrame(animate);
				});
			}
		};

		animate();
		this.currentTween = newTween;
	}

	protected addScrollEventHandlers() {
		let scrollElement = this.getScrollElement();

		this.removeScrollEventHandlers();
		if (!scrollElement) {
			return;
		}

		this.zone.runOutsideAngular(() => {
			if (this.parentScroll instanceof Window) {
				this.disposeScrollHandler = this.renderer.listen('window', 'scroll', this.refreshHandler);
				this.disposeResizeHandler = this.renderer.listen('window', 'resize', this.refreshHandler);
			}
			else {
				this.disposeScrollHandler = this.renderer.listen(scrollElement, 'scroll', this.refreshHandler);
			}
		});
	}

	protected removeScrollEventHandlers() {
		if (this.disposeScrollHandler) {
			this.disposeScrollHandler();
			this.disposeScrollHandler = undefined;
		}
		if (this.disposeResizeHandler) {
			this.disposeResizeHandler();
			this.disposeResizeHandler = undefined;
		}
	}

	protected getElementsOffset(): number {
		let offset = 0;

		if (this.containerElementRef && this.containerElementRef.nativeElement) {
			offset += this.containerElementRef.nativeElement[this._offsetType];
		}

		if (this.parentScroll) {
			let scrollElement: Element = this.getScrollElement();
			let elementClientRect = this.element.nativeElement.getBoundingClientRect();
			let scrollClientRect = scrollElement.getBoundingClientRect();
			if (this.horizontal) {
				offset += elementClientRect.left - scrollClientRect.left;
			}
			else {
				offset += elementClientRect.top - scrollClientRect.top;
			}

			if (!(this.parentScroll instanceof Window)) {
				offset += scrollElement[this._scrollType];
			}
		}

		return offset;
	}

	protected countItemsPerRow() {
		return this.countItemsPerDirection('offsetTop');
	}

	protected countItemsPerCol() {
		return this.countItemsPerDirection('offsetLeft');
	}

	protected countItemsPerDirection(propertyName: string) {
		let children = this.contentElementRef.nativeElement.children;

		let childrenLength = children ? children.length : 0;
		if (childrenLength === 0) {
			return 1;
		}

		let firstOffset = children[0][propertyName];
		let result = 1;
		while (result < childrenLength && firstOffset === children[result][propertyName]) {
			++result;
		}

		return result;
	}

	protected getScrollValue(): number {
		let windowScrollValue = undefined;
		if (this.parentScroll instanceof Window) {
			windowScrollValue = window[this._pageOffsetType];
		}

		return windowScrollValue || this.getScrollElement()[this._scrollType] || 0;
	}

	protected calculateDimensions() {
		let el = this.getScrollElement();
		let items = this.items || [];
		let itemCount = items.length;

		this.calculatedScrollbarWidth = Math.max(el.offsetWidth - el.clientWidth, this.calculatedScrollbarWidth);
		this.calculatedScrollbarHeight = Math.max(el.offsetHeight - el.clientHeight, this.calculatedScrollbarHeight);

		let viewWidth = el.clientWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth);
		let viewHeight = el.clientHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight);

		let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;

		let contentDimensions = { width: viewWidth, height: viewHeight };
		if (!this.childWidth || !this.childHeight) {
			let firstChild = content.children.length > 0 ? content.children[0] : undefined;
			if (firstChild) {
				contentDimensions = firstChild.getBoundingClientRect();
			}
		}

		let childWidth = this.childWidth || contentDimensions.width;
		let childHeight = this.childHeight || contentDimensions.height;

		let itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
		let itemsPerColByCalc = Math.max(1, Math.floor(viewHeight / childHeight));

		let itemsPerRow = !this.horizontal ? this.countItemsPerRow() : itemsPerRowByCalc;
		let itemsPerCol = this.horizontal ? this.countItemsPerCol() : itemsPerColByCalc;

		let maxHeightInRow = 0;
		let maxWidthInRow = 0;

		let sumOfCurrentChildHeight = 0;
		let sumOfCurrentChildWidth = 0;

		for (let i = 0; i < content.children.length; ++i) {
			let child = content.children[i];
			let index = this.previousStart + i;
			let clientRect = (!this.childHeight || !this.childWidth) ? child.getBoundingClientRect() : undefined;
			this.itemsHeight[index] = this.childHeight || clientRect.height;
			this.itemsWidth[index] = this.childWidth || clientRect.width;
			maxHeightInRow = Math.max(maxHeightInRow, this.itemsHeight[index]);
			maxWidthInRow = Math.max(maxWidthInRow, this.itemsWidth[index]);
			if ((index + 1) % itemsPerRow === 0) {
				sumOfCurrentChildHeight += maxHeightInRow * itemsPerRow;
				maxHeightInRow = 0;
			}
			if ((index + 1) % itemsPerCol === 0) {
				sumOfCurrentChildWidth += maxWidthInRow * itemsPerCol;
				maxWidthInRow = 0;
			}
		}

		let scroll = Math.max(0, this.getScrollValue());

		const scrollHeight = Math.ceil((childHeight * (itemCount - this.previousEnd) + sumOfCurrentChildHeight) / itemsPerRow + this.lastPadding);
		const scrollWidth = Math.ceil((childWidth * (itemCount - this.previousEnd) + sumOfCurrentChildWidth) / itemsPerCol + this.lastPadding);

		if (this.horizontal) {
			if (itemsPerRow === 1 && Math.floor(scroll / scrollWidth * itemCount) + itemsPerColByCalc >= itemCount) {
				itemsPerCol = itemsPerColByCalc;
			}
			if (scrollWidth !== this.lastScrollWidth) {
				this.renderer.setStyle(this.shimElementRef.nativeElement, 'width', `${scrollWidth}px`);
				this.lastScrollWidth = scrollWidth;
			}
		}
		else {
			if (itemsPerCol === 1 && Math.floor(scroll / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
				itemsPerRow = itemsPerRowByCalc;
			}
			if (scrollHeight !== this.lastScrollHeight) {
				this.renderer.setStyle(this.shimElementRef.nativeElement, 'height', `${scrollHeight}px`);
				this.lastScrollHeight = scrollHeight;
			}
		}

		return {
			itemCount: itemCount,
			childWidth: childWidth,
			childHeight: childHeight,
			itemsPerRow: itemsPerRow,
			itemsPerCol: itemsPerCol,
			scrollHeight: scrollHeight,
			scrollWidth: scrollWidth
		};
	}

	protected calculateItems(forceViewportUpdate: boolean = false) {
		let d = this.calculateDimensions();
		let items = this.items || [];
		let offset = this.getElementsOffset();
		let elScroll = this.getScrollValue();
		if (elScroll > d[this._scrollDim] && !(this.parentScroll instanceof Window)) {
			elScroll = d[this._scrollDim] + offset;
		}

		let scroll = Math.max(0, elScroll - offset);
		let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;

		let indexByScroll = this.previousStart / d[this._itemsPerOpScrollDir];
		let childrenContent = content.children;
		if (this.lastPadding > scroll) {
			// scroll up
			indexByScroll -= (this.lastPadding - scroll) / d[this._childScrollDim];
		} else {
			// scroll down

			let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

			let paddingCurrent = this.lastPadding;
			for (let child of childrenContent) {
				let childSize = childSizeOverride;
				if (!childSize) {
					let boundingRect = child.getBoundingClientRect();
					childSize = this.horizontal ? boundingRect.width : boundingRect.height;
				}
				paddingCurrent += childSize;
				if (paddingCurrent > scroll) {
					indexByScroll += 1 - (paddingCurrent - scroll) / childSize;
					break;
				} else {
					++indexByScroll;
				}
			}

			if (scroll > paddingCurrent) {
				indexByScroll += (scroll - paddingCurrent) / d[this._childScrollDim];
			}
		}

		let end = Math.min(d.itemCount, (Math.ceil(indexByScroll) + d[this._itemsPerScrollDir] + 1) * d[this._itemsPerOpScrollDir]);
		let maxStartEnd = end;

		const modEnd = end % d[this._itemsPerOpScrollDir];
		if (modEnd) {
			maxStartEnd = end + d[this._itemsPerOpScrollDir] - modEnd;
		}
		let maxStart = Math.max(0, maxStartEnd - d[this._itemsPerScrollDir] * d[this._itemsPerOpScrollDir] - d[this._itemsPerOpScrollDir]);
		let start = Math.min(maxStart, Math.floor(indexByScroll) * d[this._itemsPerOpScrollDir]);

		start = !isNaN(start) ? start : -1;
		end = !isNaN(end) ? end : -1;
		start -= this.bufferAmount;
		start = Math.max(0, start);
		end += this.bufferAmount;
		end = Math.min(items.length, end);

		let newPadding: number = this.lastPadding;

		if (start === 0) {
			newPadding = 0;
			this.previousStart = 0;
		} else {

			let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

			if (!childSizeOverride && this.previousPageSize && this.previousScrollNumberElements && childrenContent[this.previousScrollNumberElements - d[this._itemsPerOpScrollDir]]) {
				let firstChild = childrenContent[0].getBoundingClientRect();
				let lastChild = childrenContent[this.previousScrollNumberElements - d[this._itemsPerOpScrollDir]].getBoundingClientRect();
				newPadding -= (this.horizontal ? lastChild.right : lastChild.bottom) - (this.horizontal ? firstChild.left : firstChild.top) - this.previousPageSize;
				this.previousPageSize = 0;
				this.previousScrollNumberElements = 0;
			}

			if (start < this.previousStart) {
				this.previousPageSize = 0;

				let childSizeHash = this.horizontal ? this.itemsWidth : this.itemsHeight;
				let defaultChildSize = d[this._childScrollDim];

				let maxChildSize = 0;
				for (let i = start; i < this.previousStart; ++i) {
					maxChildSize = Math.max(maxChildSize, childSizeHash[i] || defaultChildSize);
					if ((i + 1) % d[this._itemsPerOpScrollDir] === 0) {
						this.previousPageSize += maxChildSize * d[this._itemsPerOpScrollDir];
						maxChildSize = 0;
					}
				}

				this.previousPageSize /= d[this._itemsPerOpScrollDir];
				newPadding -= this.previousPageSize;

				this.previousScrollNumberElements = this.previousStart - start;
			} else {
				newPadding += d[this._childScrollDim] * (start - this.previousStart) / d[this._itemsPerOpScrollDir];
			}

			newPadding = Math.round(newPadding);
		}

		if (newPadding !== this.lastPadding) {
			this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `${this._translateDir}(${newPadding}px)`);
			this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${newPadding}px)`);
			this.lastPadding = newPadding;
		}

		if (start !== this.previousStart || end !== this.previousEnd || forceViewportUpdate) {
			this.zone.run(() => {

				// update the scroll list
				let _end = end >= 0 ? end : 0; // To prevent from accidentally selecting the entire array with a negative 1 (-1) in the end position. 
				this.viewPortItems = items.slice(start, _end);
				this.update.emit(this.viewPortItems);

				// emit 'start' event
				if (start !== this.previousStart && this.startupLoop === false) {
					this.start.emit({ start, end });
				}

				// emit 'end' event
				if (end !== this.previousEnd && this.startupLoop === false) {
					this.end.emit({ start, end });
				}

				this.previousStart = start;
				this.previousEnd = end;

				if (this.startupLoop) {
					this.refresh();
					return;
				} else {
					this.change.emit({ start, end });
				}

				if ((this.previousPageSize && this.previousScrollNumberElements)) {
					this.refresh();
				}
			});
		} else if (this.startupLoop) {
			this.startupLoop = false;
			this.change.emit({ start, end });
			this.refresh();
		}
	}
}

@NgModule({
	exports: [VirtualScrollComponent],
	declarations: [VirtualScrollComponent],
	imports: [CommonModule]

})
export class VirtualScrollModule { }
