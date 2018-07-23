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
	itemsPerWrapGroup: number;
	wrapGroupsPerPage: number;
	itemsPerPage: number;
	pageCount_fractional: number;
	childWidth: number;
	childHeight: number;
	scrollLength: number;
}

export interface IPageInfo {
	arrayStartIndex: number;
	arrayEndIndex: number;
}

export interface IViewport extends IPageInfo {
	padding: number;
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
      max-width: 100vw;
      max-height: 100vh;
      position: absolute;
    }
	
	:host.horizontal {
		white-space: nowrap;
	}
	
	:host.horizontal .scrollable-content {
		display: flex;
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

	@Input()
	public resizeBypassRefreshTheshold: number = 5;

	protected checkScrollElementResizedTimer: number;
	protected _checkResizeInterval: number = 1000;
	@Input()
	public get checkResizeInterval(): number {
		return this._checkResizeInterval;
	}
	public set checkResizeInterval(value: number) {
		if (this._checkResizeInterval === value) {
			return;
		}

		this._checkResizeInterval = value;
		this.addScrollEventHandlers();
	}

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

	protected _horizontal: boolean;
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

	public scrollInto(item: any, alignToBeginning: boolean = true, additionalOffset: number = 0, animationMilliseconds: number = undefined, animationCompletedCallback: () => void = undefined) {
		let index: number = this.items.indexOf(item);
		if (index === -1) {
			return;
		}

		this.scrollToIndex(index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback);
	}

	public scrollToIndex(index: number, alignToBeginning: boolean = true, additionalOffset: number = 0, animationMilliseconds: number = undefined, animationCompletedCallback: () => void = undefined) {
		animationCompletedCallback = animationCompletedCallback || (() => { });
		animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;

		let scrollElement = this.getScrollElement();
		let offset = this.getElementsOffset();

		let dimensions = this.calculateDimensions();
		let scroll = this.calculatePadding(index, dimensions, false) + offset + additionalOffset;
		if (!alignToBeginning) {
			scroll -= dimensions.wrapGroupsPerPage * dimensions[this._childScrollDim];
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

	protected previousScrollBoundingRect: ClientRect;
	protected checkScrollElementResized(): void {
		let boundingRect = this.getScrollElement().getBoundingClientRect();

		let sizeChanged: boolean;
		if (!this.previousScrollBoundingRect) {
			sizeChanged = true;
		} else {
			let widthChange = Math.abs(boundingRect.width - this.previousScrollBoundingRect.width);
			let heightChange = Math.abs(boundingRect.height - this.previousScrollBoundingRect.height);
			sizeChanged = widthChange > this.resizeBypassRefreshTheshold || heightChange > this.resizeBypassRefreshTheshold;
		}

		if (sizeChanged) {
			this.previousScrollBoundingRect = boundingRect;
			this.refresh();
		}
	}

	protected _invisiblePaddingProperty;
	protected _offsetType;
	protected _scrollType;
	protected _pageOffsetType;
	protected _childScrollDim;
	protected _translateDir;
	protected updateDirection(): void {
		if (this.horizontal) {
			this._invisiblePaddingProperty = 'width';
			this._offsetType = 'offsetLeft';
			this._pageOffsetType = 'pageXOffset';
			this._childScrollDim = 'childWidth';
			this._translateDir = 'translateX';
			this._scrollType = 'scrollLeft';
		}
		else {
			this._invisiblePaddingProperty = 'height';
			this._offsetType = 'offsetTop';
			this._pageOffsetType = 'pageYOffset';
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
	protected previousViewPort: IViewport = <any>{};
	protected currentTween: tween.Tween;
	protected itemsHeight: { [key: number]: number } = {};
	protected itemsWidth: { [key: number]: number } = {};
	protected cachedItemsLength: number;

	protected disposeScrollHandler: () => void | undefined;
	protected disposeResizeHandler: () => void | undefined;

	protected refresh_internal(itemsArrayModified: boolean, maxRunTimes: number = 2) {
		//note: maxRunTimes is to force it to keep recalculating if the previous iteration caused a re-render (different sliced items in viewport or scrollPosition changed). 
		//The default of 2x max will probably be accurate enough without causing too large a performance bottleneck
		//The code would typically quit out on the 2nd iteration anyways. The main time it'd think more than 2 runs would be necessary would be for vastly different sized child items.
		//Without maxRunTimes, If the user is actively scrolling this code would run indefinitely. However, we want to short-circuit it because there are separate scroll event handlers which call this function & we don't want to do the work 2x.

		this.zone.runOutsideAngular(() => {
			requestAnimationFrame(() => {
				let viewport = this.calculateViewport(itemsArrayModified);

				let startChanged = itemsArrayModified || viewport.arrayStartIndex !== this.previousViewPort.arrayStartIndex;
				let endChanged = itemsArrayModified || viewport.arrayEndIndex !== this.previousViewPort.arrayEndIndex;
				let scrollLengthChanged = viewport.scrollLength !== this.previousViewPort.scrollLength;
				let paddingChanged = viewport.padding !== this.previousViewPort.padding;

				this.previousViewPort = viewport;

				if (scrollLengthChanged) {
					this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, this._invisiblePaddingProperty, `${viewport.scrollLength}px`);
				}

				if (paddingChanged) {
					this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `${this._translateDir}(${viewport.padding}px)`);
					this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${viewport.padding}px)`);
				}

				let emitIndexChangedEvents = true; // maxReRunTimes === 1 (would need to still run if didn't update if previous iteration had updated)

				if (startChanged || endChanged) {
					this.zone.run(() => {

						// update the scroll list to trigger re-render of components in viewport
						this.viewPortItems = viewport.arrayStartIndex >= 0 && viewport.arrayEndIndex >= 0 ? this.items.slice(viewport.arrayStartIndex, viewport.arrayEndIndex + 1) : [];
						this.update.emit(this.viewPortItems);

						if (emitIndexChangedEvents) {
							if (startChanged) {
								this.start.emit({ start: viewport.arrayStartIndex, end: viewport.arrayEndIndex });
							}

							if (endChanged) {
								this.end.emit({ start: viewport.arrayStartIndex, end: viewport.arrayEndIndex });
							}

							if (startChanged || endChanged) {
								this.change.emit({ start: viewport.arrayStartIndex, end: viewport.arrayEndIndex });
							}
						}

						if (maxRunTimes > 0) {
							this.refresh_internal(false, maxRunTimes - 1);
							return;
						}
					});
				} else if (maxRunTimes > 0) {
					if (scrollLengthChanged || paddingChanged) {
						this.refresh_internal(false, maxRunTimes - 1);
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
				if (this._checkResizeInterval > 0) {
					this.checkScrollElementResizedTimer = <any>setInterval(() => { this.checkScrollElementResized(); }, this._checkResizeInterval);
				}
			}
		});
	}

	protected removeScrollEventHandlers() {
		if (this.checkScrollElementResizedTimer) {
			clearInterval(this.checkScrollElementResizedTimer);
		}

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

	protected countItemsPerWrapGroup() {
		let propertyName = this.horizontal ? 'offsetLeft' : 'offsetTop';
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

	protected getScrollPosition(): number {
		let windowScrollValue = undefined;
		if (this.parentScroll instanceof Window) {
			windowScrollValue = window[this._pageOffsetType];
		}

		return windowScrollValue || this.getScrollElement()[this._scrollType] || 0;
	}

	protected calculateDimensions(): IDimensions {
		let scrollElement = this.getScrollElement();
		let itemCount = this.items.length;

		const maxCalculatedScrollBarSize: number = 25; // Note: Formula to auto-calculate doesn't work for ParentScroll, so we default to this if not set by consuming application
		this.calculatedScrollbarWidth = Math.max(Math.min(scrollElement.offsetHeight - scrollElement.clientHeight, maxCalculatedScrollBarSize), this.calculatedScrollbarWidth);
		this.calculatedScrollbarHeight = Math.max(Math.min(scrollElement.offsetWidth - scrollElement.clientWidth, maxCalculatedScrollBarSize), this.calculatedScrollbarHeight);

		let viewWidth = scrollElement.clientWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth || (this.horizontal ? 0 : maxCalculatedScrollBarSize));
		let viewHeight = scrollElement.clientHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight || (this.horizontal ? maxCalculatedScrollBarSize : 0));

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

		let itemsPerRow = Math.ceil(viewWidth / childWidth);
		let itemsPerCol = Math.ceil(viewHeight / childHeight);

		if (this.enableUnequalChildrenSizes_Experimental) {
			let maxHeightInRow = 0;
			let maxWidthInRow = 0;

			let sumOfCurrentChildHeight = 0;
			let sumOfCurrentChildWidth = 0;

			for (let i = 0; i < content.children.length; ++i) {
				let child = content.children[i];
				let index = this.previousViewPort.arrayStartIndex + i;
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

			//scrollHeight = Math.ceil((childHeight * (itemCount - this.previousViewPort.arrayEndIndex) + sumOfCurrentChildHeight) / itemsPerRow + this.previousViewPort.padding);
			//scrollWidth = Math.ceil((childWidth * (itemCount - this.previousViewPort.arrayEndIndex) + sumOfCurrentChildWidth) / itemsPerCol + this.previousViewPort.padding);
		}

		itemsPerCol = Math.max(itemsPerCol, 1);
		itemsPerRow = Math.max(itemsPerRow, 1);

		let itemsPerWrapGroup = this.countItemsPerWrapGroup();
		let wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
		let itemsPerPage = itemsPerWrapGroup * wrapGroupsPerPage;
		let pageCount_fractional = itemCount / itemsPerPage;
		let numberOfWrapGroups = Math.ceil(itemCount / itemsPerWrapGroup);
		let scrollLength = numberOfWrapGroups * (this.horizontal ? childWidth : childHeight);

		return {
			itemCount: itemCount,
			itemsPerWrapGroup: itemsPerWrapGroup,
			wrapGroupsPerPage: wrapGroupsPerPage,
			itemsPerPage: itemsPerPage,
			pageCount_fractional: pageCount_fractional,
			childWidth: childWidth,
			childHeight: childHeight,
			scrollLength: scrollLength
		};
	}

	protected cachedPageSize: number = 0;
	protected previousScrollNumberElements: number = 0;

	protected calculatePadding(arrayStartIndex: number, dimensions: IDimensions, allowUnequalChildrenSizes_Experimental: boolean): number {
		if (dimensions.itemCount === 0) {
			return 0;
		}

		//UnequalChildrenSizes_Experimental isn't "pure", because it relies on & modifies previous viewport. It seems risky to call it during scrollInto since the original PR didn't. Once it's "pure" we can re-use it in both places.
		if (!allowUnequalChildrenSizes_Experimental || !this.enableUnequalChildrenSizes_Experimental) {
			let wrapGroups = Math.ceil(arrayStartIndex / dimensions.itemsPerWrapGroup);
			return dimensions[this._childScrollDim] * wrapGroups;
		}

		let offset = this.getElementsOffset();

		if (arrayStartIndex === 0) {
			return 0;
		}

		let newPadding: number = this.previousViewPort.padding;

		let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
		let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

		if (!childSizeOverride && this.cachedPageSize && this.previousScrollNumberElements && content.children[this.previousScrollNumberElements - dimensions.itemsPerWrapGroup]) {
			let firstChild = content.children[0].getBoundingClientRect();
			let lastChild = content.children[this.previousScrollNumberElements - dimensions.itemsPerWrapGroup].getBoundingClientRect();
			newPadding -= (this.horizontal ? lastChild.right : lastChild.bottom) - (this.horizontal ? firstChild.left : firstChild.top) - this.cachedPageSize;
			this.cachedPageSize = 0;
			this.previousScrollNumberElements = 0;
		}

		if (arrayStartIndex < this.previousViewPort.arrayStartIndex) {
			this.cachedPageSize = 0;

			let childSizeHash = this.horizontal ? this.itemsWidth : this.itemsHeight;
			let defaultChildSize = dimensions[this._childScrollDim];

			let maxChildSize = 0;
			for (let i = arrayStartIndex; i < this.previousViewPort.arrayStartIndex; ++i) {
				maxChildSize = Math.max(maxChildSize, childSizeHash[i] || defaultChildSize);
				if ((i + 1) % dimensions.itemsPerWrapGroup === 0) {
					this.cachedPageSize += maxChildSize * dimensions.itemsPerWrapGroup;
					maxChildSize = 0;
				}
			}

			this.cachedPageSize /= dimensions.itemsPerWrapGroup;
			newPadding -= this.cachedPageSize;

			this.previousScrollNumberElements = this.previousViewPort.arrayStartIndex - arrayStartIndex;
		} else {
			newPadding += dimensions[this._childScrollDim] * (arrayStartIndex - this.previousViewPort.arrayStartIndex) / dimensions.itemsPerWrapGroup;
		}

		return Math.round(newPadding) + offset;
	}

	protected calculatePageInfo(scrollPosition: number, dimensions: IDimensions): IPageInfo {
		let scrollPercentage = scrollPosition / dimensions.scrollLength;
		let startingArrayIndex_fractional = Math.min(Math.max(scrollPercentage * dimensions.pageCount_fractional, 0), dimensions.pageCount_fractional) * dimensions.itemsPerPage;

		let maxStart = dimensions.itemCount - dimensions.itemsPerPage - 1;
		let arrayStartIndex = Math.min(Math.floor(startingArrayIndex_fractional), maxStart);
		arrayStartIndex -= arrayStartIndex % dimensions.itemsPerWrapGroup; // round down to start of wrapGroup

		let arrayEndIndex = Math.ceil(startingArrayIndex_fractional) + dimensions.itemsPerPage - 1;
		arrayEndIndex += (dimensions.itemsPerWrapGroup - (arrayEndIndex+1) % dimensions.itemsPerWrapGroup); // round up to end of wrapGroup

		let bufferSize = this.bufferAmount * dimensions.itemsPerWrapGroup;
		arrayStartIndex -= bufferSize;
		arrayEndIndex += bufferSize;

		if (isNaN(arrayStartIndex)) {
			arrayStartIndex = -1;
		}
		if (isNaN(arrayEndIndex)) {
			arrayEndIndex = -1;
		}

		return {
			arrayStartIndex: Math.min(Math.max(arrayStartIndex, 0), dimensions.itemCount - 1),
			arrayEndIndex: Math.min(Math.max(arrayEndIndex, 0), dimensions.itemCount - 1)
		};
	}

	protected calculateViewport(forceViewportUpdate: boolean = false): IViewport {
		let dimensions = this.calculateDimensions();
		let offset = this.getElementsOffset();

		let scrollPosition = this.getScrollPosition();
		if (scrollPosition > dimensions.scrollLength && !(this.parentScroll instanceof Window)) {
			scrollPosition = dimensions.scrollLength;
		} else {
			scrollPosition -= offset;
		}
		scrollPosition = Math.max(0, scrollPosition);

		let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;

		let pageInfo;

		if (this.enableUnequalChildrenSizes_Experimental) {
			let indexByScroll = this.previousViewPort.arrayStartIndex / dimensions.itemsPerWrapGroup;
			if (this.previousViewPort.padding > scrollPosition) {
				// scroll up
				indexByScroll -= (this.previousViewPort.padding - scrollPosition) / dimensions[this._childScrollDim];
			} else {
				// scroll down

				let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

				let paddingCurrent = this.previousViewPort.padding;
				for (let child of content.children) {
					let childSize = childSizeOverride;
					if (!childSize) {
						let boundingRect = child.getBoundingClientRect();
						childSize = this.horizontal ? boundingRect.width : boundingRect.height;
					}
					paddingCurrent += childSize;
					if (paddingCurrent > scrollPosition) {
						indexByScroll += 1 - (paddingCurrent - scrollPosition) / childSize;
						break;
					} else {
						++indexByScroll;
					}
				}

				if (scrollPosition > paddingCurrent) {
					indexByScroll += (scrollPosition - paddingCurrent) / dimensions[this._childScrollDim];
				}
			}

			let newEnd = Math.min(dimensions.itemCount, (Math.ceil(indexByScroll) + dimensions.wrapGroupsPerPage + 1) * dimensions.itemsPerWrapGroup);
			let maxStartEnd = newEnd;

			const modEnd = newEnd % dimensions.itemsPerWrapGroup;
			if (modEnd) {
				maxStartEnd = newEnd + dimensions.itemsPerWrapGroup - modEnd;
			}
			let maxStart = Math.max(0, maxStartEnd - dimensions.wrapGroupsPerPage * dimensions.itemsPerWrapGroup - dimensions.itemsPerWrapGroup);
			let newStart = Math.min(maxStart, Math.floor(indexByScroll) * dimensions.itemsPerWrapGroup);

			newStart = !isNaN(newStart) ? newStart : -1;
			newEnd = !isNaN(newEnd) ? newEnd : -1;
			newStart = Math.max(0, Math.min(dimensions.itemCount - 1, newStart));
			newEnd = Math.max(0, Math.min(dimensions.itemCount - 1, newEnd));

			pageInfo = {
				start: newStart,
				end: newEnd
			};
		}
		else {
			pageInfo = this.calculatePageInfo(scrollPosition, dimensions);
		}

		let newPadding = this.calculatePadding(pageInfo.arrayStartIndex, dimensions, true);
		let newScrollLength = dimensions.scrollLength;

		return {
			arrayStartIndex: pageInfo.arrayStartIndex,
			arrayEndIndex: pageInfo.arrayEndIndex,
			padding: Math.round(newPadding),
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
