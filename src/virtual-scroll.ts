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
	ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import * as tween from '@tweenjs/tween.js'

export interface ChangeEvent {
	start?: number;
	end?: number;
}

export interface IDimensions {
	itemCount: number;
	childWidth: number;
	childHeight: number;
	itemsPerRow: number;
	itemsPerCol: number;
	scrollHeight: number;
	scrollWidth: number;
}

export interface CalculateItemsResult {
	start: number;
	end: number;
	scrollPosition: number;
	scrollLength: number;
}

@Component({
	selector: 'virtual-scroll,[virtualScroll]',
	exportAs: 'virtualScroll',
	template: `
    <div class="total-padding" #invisiblePadding></div>
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
	public viewPortItems: any[];
	public window = window;

	@Input()
	public enableUnequalChildrenSizes_Experimental: boolean = false;

	@Input()
	public scrollbarWidth: number;

	@Input()
	public scrollbarHeight: number;

	@Input()
	public childWidth: number;

	@Input()
	public childHeight: number;

	@Input()
	public bufferAmount: number = 0;

	@Input()
	public scrollAnimationTime: number = 750;

	protected _items: any[] = [];
	@Input()
	public get items(): any[] {
		return this._items;
	}
	public set items(value: any[]) {
		if (value === this._items) {
			return;
		}

		this._items = value || [];
		this.refresh_internal(true);
	}

	@Input()
	public get horizontal(): boolean {
		return this._horizontal;
	}
	public set horizontal(value: boolean) {
		this._horizontal = value;
		this.updateDirection();
	}

	protected _parentScroll: Element | Window;
	@Input()
	public get parentScroll(): Element | Window {
		return this._parentScroll;
	}
	public set parentScroll(value: Element | Window) {
		if (this._parentScroll === value) {
			return;
		}

		this._parentScroll = value;
		this.addScrollEventHandlers();

		let scrollElement = this.getScrollElement();
		if (scrollElement !== this.element.nativeElement) {
			scrollElement.style['overflow-y'] = this.horizontal ? 'visible' : 'auto';
			scrollElement.style['overflow-x'] = this.horizontal ? 'auto' : 'visible';
		}
	}

	@Output()
	public update: EventEmitter<any[]> = new EventEmitter<any[]>();

	@Output()
	public change: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@Output()
	public start: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@Output()
	public end: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@ViewChild('content', { read: ElementRef })
	public contentElementRef: ElementRef;

	@ViewChild('invisiblePadding', { read: ElementRef })
	public invisiblePaddingElementRef: ElementRef;

	@ContentChild('container', { read: ElementRef })
	public containerElementRef: ElementRef;

	public ngOnInit() {
		this.addScrollEventHandlers();
	}

	public ngOnDestroy() {
		this.removeScrollEventHandlers();
	}

	public ngOnChanges(changes: any) {
		let indexLengthChanged = this.cachedItemsLength !== this.items.length;
		this.cachedItemsLength = this.items.length;

		const firstRun: boolean = !changes.items || !changes.items.previousValue || changes.items.previousValue.length === 0;
		this.refresh_internal(indexLengthChanged || firstRun);
	}

	public ngDoCheck() {
		if (this.cachedItemsLength !== this.items.length) {
			this.cachedItemsLength = this.items.length;
			this.refresh_internal(true);
		}
	}

	public refresh() {
		this.refresh_internal(false);
	}

	public scrollInto(item: any, alignToTop: boolean = true, additionalOffset: number = 0, animationMilliseconds: number = undefined, animationCompletedCallback: () => void = undefined) {
		let index: number = this.items.indexOf(item);
		if (index === -1) {
			return;
		}

		this.scrollToIndex(index, alignToTop, additionalOffset, animationMilliseconds, animationCompletedCallback);
	}

	public scrollToIndex(index: number, alignToBeginning: boolean = true, additionalOffset: number = 0, animationMilliseconds: number = undefined, animationCompletedCallback: () => void = undefined) {
		animationCompletedCallback = animationCompletedCallback || (() => { });
		animationMilliseconds = animationMilliseconds || this.scrollAnimationTime;

		let scrollElement = this.getScrollElement();

		let dimensions = this.calculateDimensions();
		let scroll = this.calculateScrollPosition(index, dimensions, false) + additionalOffset;
		if (!alignToBeginning) {
			scroll -= Math.max(0, (dimensions[this._itemsPerScrollDir] - 1)) * dimensions[this._childScrollDim];
		}

		let animationRequest: number;

		if (this.currentTween) {
			this.currentTween.stop();
			this.currentTween = undefined;
		}

		if (!animationMilliseconds) {
			this.renderer.setProperty(scrollElement, this._scrollType, scroll);
			this.refresh();
			animationCompletedCallback();
			return;
		}

		const tweenConfigObj = { scroll: scrollElement[this._scrollType] };

		let newTween = new tween.Tween(tweenConfigObj)
			.to({ scroll }, animationMilliseconds)
			.easing(tween.Easing.Quadratic.Out)
			.onUpdate((data) => {
				if (isNaN(data.scroll)) {
					return;
				}
				this.renderer.setProperty(scrollElement, this._scrollType, data.scroll);
				this.refresh();
			})
			.onStop(() => {
				cancelAnimationFrame(animationRequest);
			})
			.start();

		const animate = (time?: number) => {
			if (!newTween.isPlaying()) {
				return;
			}

			newTween.update(time);
			if (tweenConfigObj.scroll === scroll) {
				animationCompletedCallback();
				return;
			}

			this.zone.runOutsideAngular(() => {
				animationRequest = requestAnimationFrame(animate);
			});
		};

		animate();
		this.currentTween = newTween;
	}

	constructor(protected readonly element: ElementRef, protected readonly renderer: Renderer2, protected readonly zone: NgZone) {
		this.horizontal = false;
	}

	protected _horizontal: boolean;
	protected _invisiblePaddingProperty;
	protected _offsetType;
	protected _scrollType;
	protected _pageOffsetType;
	protected _scrollDim;
	protected _itemsPerScrollDir;
	protected _itemsPerOpScrollDir;
	protected _childScrollDim;
	protected _translateDir;
	protected updateDirection(): void {
		if (this.horizontal) {
			this._invisiblePaddingProperty = 'width';
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
			this._invisiblePaddingProperty = 'height';
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

	protected calculatedScrollbarWidth: number = 0;
	protected calculatedScrollbarHeight: number = 0;

	protected padding: number = 0;
	protected previousStart: number = 0;
	protected previousEnd: number = -1;
	protected currentTween: tween.Tween;
	protected itemsHeight: { [key: number]: number } = {};
	protected itemsWidth: { [key: number]: number } = {};
	protected cachedItemsLength: number;

	protected disposeScrollHandler: () => void | undefined;
	protected disposeResizeHandler: () => void | undefined;

	/** Cache of the last scroll to prevent setting CSS when not needed. */
	protected lastScrollLength = -1;

	/** Cache of the last padding to prevent setting CSS when not needed. */
	protected lastScrollPosition = -1;

	protected refresh_internal(itemsArrayModified: boolean, maxReRunTimes: number = 5) {
		this.zone.runOutsideAngular(() => {
			requestAnimationFrame(() => {

				let calculateItemsResult = this.calculateItems(itemsArrayModified);

				let startChanged = calculateItemsResult.start !== this.previousStart || itemsArrayModified;
				let endChanged = calculateItemsResult.end !== this.previousEnd || itemsArrayModified;
				let scrollLengthChanged = calculateItemsResult.scrollLength !== this.lastScrollLength;
				let scrollPositionChanged = calculateItemsResult.scrollPosition !== this.lastScrollPosition;

				this.previousStart = calculateItemsResult.start;
				this.previousEnd = calculateItemsResult.end;
				this.lastScrollLength = calculateItemsResult.scrollLength;
				this.lastScrollPosition = calculateItemsResult.scrollPosition;

				if (scrollLengthChanged) {
					this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, this._invisiblePaddingProperty, `${calculateItemsResult.scrollLength}px`);
				}

				if (scrollPositionChanged) {
					this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `${this._translateDir}(${calculateItemsResult.scrollPosition}px)`);
					this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${calculateItemsResult.scrollPosition}px)`);
				}

				let emitIndexChangedEvents = true; // maxReRunTimes === 1 (would need to still run if didn't update if previous iteration had updated)

				if (startChanged || endChanged) {
					this.zone.run(() => {

						// update the scroll list to trigger re-render of components in viewport
						this.viewPortItems = this.items.slice(calculateItemsResult.start, calculateItemsResult.end);
						this.update.emit(this.viewPortItems);

						if (emitIndexChangedEvents) {
							if (startChanged) {
								this.start.emit({ start: calculateItemsResult.start, end: calculateItemsResult.end });
							}

							if (endChanged) {
								this.end.emit({ start: calculateItemsResult.start, end: calculateItemsResult.end });
							}

							if (startChanged || endChanged) {
								this.change.emit({ start: calculateItemsResult.start, end: calculateItemsResult.end });
							}
						}

						if (maxReRunTimes > 0) {
							this.refresh_internal(false, maxReRunTimes - 1);
							return;
						}
					});
				} else if (maxReRunTimes > 0) {
					if (scrollLengthChanged || scrollPositionChanged) {
						this.refresh_internal(false, maxReRunTimes - 1);
					}
				}
			});
		});
	}

	protected getScrollElement(): HTMLElement {
		return this.parentScroll instanceof Window ? document.scrollingElement || document.documentElement || document.body : this.parentScroll || this.element.nativeElement;
	}

	protected addScrollEventHandlers() {
		let scrollElement = this.getScrollElement();

		this.removeScrollEventHandlers();

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
			let scrollElement = this.getScrollElement();
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

	protected calculateDimensions(): IDimensions {
		let scrollElement = this.getScrollElement();
		let itemCount = this.items.length;

		this.calculatedScrollbarWidth = Math.max(scrollElement.offsetWidth - scrollElement.clientWidth, this.calculatedScrollbarWidth);
		this.calculatedScrollbarHeight = Math.max(scrollElement.offsetHeight - scrollElement.clientHeight, this.calculatedScrollbarHeight);

		let viewWidth = scrollElement.clientWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth);
		let viewHeight = scrollElement.clientHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight);

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

		let scroll = Math.max(0, this.getScrollValue());

		let scrollHeight = childHeight * Math.ceil(itemCount / itemsPerRow);
		let scrollWidth = childWidth * Math.ceil(itemCount / itemsPerCol);

		if (this.enableUnequalChildrenSizes_Experimental) {
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

			scrollHeight = Math.ceil((childHeight * (itemCount - this.previousEnd) + sumOfCurrentChildHeight) / itemsPerRow + this.lastScrollPosition);
			scrollWidth = Math.ceil((childWidth * (itemCount - this.previousEnd) + sumOfCurrentChildWidth) / itemsPerCol + this.lastScrollPosition);
		}

		if (this.horizontal) {
			if (itemsPerRow === 1 && Math.floor(scroll / scrollWidth * itemCount) + itemsPerColByCalc >= itemCount) {
				itemsPerCol = itemsPerColByCalc;
			}
		}
		else {
			if (itemsPerCol === 1 && Math.floor(scroll / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
				itemsPerRow = itemsPerRowByCalc;
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

	protected cachedPageSize: number = 0;
	protected previousScrollNumberElements: number = 0;

	protected calculateScrollPosition(start: number, dimensions: IDimensions, allowUnequalChildrenSizes_Experimental: boolean): number {
		let offset = this.getElementsOffset();

		//complex calculation isn't "pure", because it relies on global state & modifies that global state. It seems risky to call it during scrollInto since the original PR didn't. Once it's "pure" we can re-use it in both places.
		if (!allowUnequalChildrenSizes_Experimental || !this.enableUnequalChildrenSizes_Experimental) {
			return this.items.length === 0 ? 0 : (dimensions[this._childScrollDim] * Math.ceil(start / dimensions[this._itemsPerOpScrollDir]) - (dimensions[this._childScrollDim] * Math.min(start, this.bufferAmount)) + offset);
		}

		let newPadding: number = this.lastScrollPosition;

		if (start === 0) {
			newPadding = 0;
			this.previousStart = 0;
		} else {
			let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
			let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

			if (!childSizeOverride && this.cachedPageSize && this.previousScrollNumberElements && content.children[this.previousScrollNumberElements - dimensions[this._itemsPerOpScrollDir]]) {
				let firstChild = content.children[0].getBoundingClientRect();
				let lastChild = content.children[this.previousScrollNumberElements - dimensions[this._itemsPerOpScrollDir]].getBoundingClientRect();
				newPadding -= (this.horizontal ? lastChild.right : lastChild.bottom) - (this.horizontal ? firstChild.left : firstChild.top) - this.cachedPageSize;
				this.cachedPageSize = 0;
				this.previousScrollNumberElements = 0;
			}

			if (start < this.previousStart) {
				this.cachedPageSize = 0;

				let childSizeHash = this.horizontal ? this.itemsWidth : this.itemsHeight;
				let defaultChildSize = dimensions[this._childScrollDim];

				let maxChildSize = 0;
				for (let i = start; i < this.previousStart; ++i) {
					maxChildSize = Math.max(maxChildSize, childSizeHash[i] || defaultChildSize);
					if ((i + 1) % dimensions[this._itemsPerOpScrollDir] === 0) {
						this.cachedPageSize += maxChildSize * dimensions[this._itemsPerOpScrollDir];
						maxChildSize = 0;
					}
				}

				this.cachedPageSize /= dimensions[this._itemsPerOpScrollDir];
				newPadding -= this.cachedPageSize;

				this.previousScrollNumberElements = this.previousStart - start;
			} else {
				newPadding += dimensions[this._childScrollDim] * (start - this.previousStart) / dimensions[this._itemsPerOpScrollDir];
			}

			return Math.round(newPadding) + offset;
		}
	}

	protected calculateItems(forceViewportUpdate: boolean = false): CalculateItemsResult {
		let dimensions = this.calculateDimensions();
		let offset = this.getElementsOffset();
		let elScroll = this.getScrollValue();
		if (elScroll > dimensions[this._scrollDim] && !(this.parentScroll instanceof Window)) {
			elScroll = dimensions[this._scrollDim];
		} else {
			elScroll -= offset;
		}

		let scroll = Math.max(0, elScroll);
		let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;

		let newStart;
		let newEnd;

		if (this.enableUnequalChildrenSizes_Experimental) {
			let indexByScroll = this.previousStart / dimensions[this._itemsPerOpScrollDir];
			if (this.lastScrollPosition > scroll) {
				// scroll up
				indexByScroll -= (this.lastScrollPosition - scroll) / dimensions[this._childScrollDim];
			} else {
				// scroll down

				let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

				let paddingCurrent = this.lastScrollPosition;
				for (let child of content.children) {
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
					indexByScroll += (scroll - paddingCurrent) / dimensions[this._childScrollDim];
				}
			}

			newEnd = Math.min(dimensions.itemCount, (Math.ceil(indexByScroll) + dimensions[this._itemsPerScrollDir] + 1) * dimensions[this._itemsPerOpScrollDir]);
			let maxStartEnd = newEnd;

			const modEnd = newEnd % dimensions[this._itemsPerOpScrollDir];
			if (modEnd) {
				maxStartEnd = newEnd + dimensions[this._itemsPerOpScrollDir] - modEnd;
			}
			let maxStart = Math.max(0, maxStartEnd - dimensions[this._itemsPerScrollDir] * dimensions[this._itemsPerOpScrollDir] - dimensions[this._itemsPerOpScrollDir]);
			newStart = Math.min(maxStart, Math.floor(indexByScroll) * dimensions[this._itemsPerOpScrollDir]);
		}
		else {
			let indexByScroll = scroll / dimensions[this._scrollDim] * dimensions.itemCount / ((this.horizontal) ? dimensions.itemsPerCol : dimensions.itemsPerRow);
			newEnd = Math.min(dimensions.itemCount, Math.ceil(indexByScroll) * dimensions[this._itemsPerOpScrollDir] + dimensions[this._itemsPerOpScrollDir] * (dimensions[this._itemsPerScrollDir] + 1));

			let maxStartEnd = newEnd;
			const modEnd = newEnd % dimensions[this._itemsPerOpScrollDir];
			if (modEnd) {
				maxStartEnd = newEnd + dimensions[this._itemsPerOpScrollDir] - modEnd;
			}
			let maxStart = Math.max(0, maxStartEnd - dimensions[this._itemsPerScrollDir] * dimensions[this._itemsPerOpScrollDir] - dimensions[this._itemsPerOpScrollDir]);
			newStart = Math.min(maxStart, Math.floor(indexByScroll) * dimensions[this._itemsPerOpScrollDir]);
		}

		newStart = !isNaN(newStart) ? newStart : -1;
		newEnd = !isNaN(newEnd) ? newEnd : -1;
		newStart -= this.bufferAmount;
		newEnd += this.bufferAmount;
		newStart = Math.max(0, Math.min(this.items.length, newStart));
		newEnd = Math.max(0, Math.min(this.items.length, newEnd));

		let newScrollPosition = this.calculateScrollPosition(newStart, dimensions, true);
		let newScrollLength = dimensions[this._scrollDim];

		return {
			start: Math.round(newStart),
			end: Math.round(newEnd),
			scrollPosition: Math.round(newScrollPosition),
			scrollLength: Math.round(newScrollLength)
		};
	}
}

@NgModule({
	exports: [VirtualScrollComponent],
	declarations: [VirtualScrollComponent],
	imports: [CommonModule]

})
export class VirtualScrollModule { }
