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

export interface WrapGroupDimensions {
	numberOfKnownWrapGroupChildSizes: number;
	sumOfKnownWrapGroupChildWidths: number;
	sumOfKnownWrapGroupChildHeights: number;
	maxChildSizePerWrapGroup: WrapGroupDimension[];
}

export interface WrapGroupDimension {
	childWidth: number;
	childHeight: number;
	items: any[];
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
	startIndex: number;
	endIndex: number;
}

export interface IPageInfoWithBuffer extends IPageInfo {
	startIndexWithBuffer: number;
	endIndexWithBuffer: number;
}

export interface IViewport extends IPageInfoWithBuffer {
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

	.scrollable-content ::ng-deep > * {
		box-sizing: border-box;
	}
	
	:host.horizontal {
		white-space: nowrap;
	}
	
	:host.horizontal .scrollable-content {
		display: flex;
	}
	
	:host.horizontal .scrollable-content ::ng-deep > * {
		flex-shrink: 0;
		flex-grow: 0;
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

	public get viewPortIndices(): IPageInfo {
		let pageInfo: IPageInfo = this.previousViewPort || <any>{};
		return {
			startIndex: pageInfo.startIndex || 0,
			endIndex: pageInfo.endIndex || 0
		};
	}

	protected _enableUnequalChildrenSizes: boolean = false;
	@Input()
	public get enableUnequalChildrenSizes(): boolean {
		return this._enableUnequalChildrenSizes;
	}
	public set enableUnequalChildrenSizes(value: boolean) {
		if (this._enableUnequalChildrenSizes === value) {
			return;
		}

		this._enableUnequalChildrenSizes = value;
		this.minMeasuredChildWidth = undefined;
		this.minMeasuredChildHeight = undefined;
	}

	@Input()
	public useMarginInsteadOfTranslate: boolean = false;

	@Input()
	public scrollbarWidth: number;

	@Input()
	public scrollbarHeight: number;

	@Input()
	public childWidth: number;

	@Input()
	public childHeight: number;

	protected _bufferAmount: number = 0;
	@Input()
	public get bufferAmount(): number {
		return Math.max(this._bufferAmount, this.enableUnequalChildrenSizes ? 5 : 0);
	}
	public set bufferAmount(value: number) {
		this._bufferAmount = value;
	}

	@Input()
	public scrollAnimationTime: number = 750;

	@Input()
	public resizeBypassRefreshTheshold: number = 5;

	protected _scrollThrottlingTime: number;
	@Input()
	public get scrollThrottlingTime(): number {
		return this._scrollThrottlingTime;
	}
	public set scrollThrottlingTime(value: number) {
		this._scrollThrottlingTime = value;
		this.refresh_throttled = <any>this.throttleTrailing(() => {
			this.refresh_internal(false);
		}, this._scrollThrottlingTime);
	}

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

	@Input()
	public compareItems: (item1: any, item2: any) => boolean = (item1: any, item2: any) => item1 === item2;

	protected _horizontal: boolean;
	@Input()
	public get horizontal(): boolean {
		return this._horizontal;
	}
	public set horizontal(value: boolean) {
		this._horizontal = value;
		this.updateDirection();
	}

	protected revertParentOverscroll(): void {
		const scrollElement = this.getScrollElement();
		if (scrollElement && this.oldParentScrollOverflow) {
			scrollElement.style['overflow-y'] = this.oldParentScrollOverflow.y;
			scrollElement.style['overflow-x'] = this.oldParentScrollOverflow.x;
		}

		this.oldParentScrollOverflow = undefined;
	}

	protected oldParentScrollOverflow: { x: string, y: string };
	protected _parentScroll: Element | Window;
	@Input()
	public get parentScroll(): Element | Window {
		return this._parentScroll;
	}
	public set parentScroll(value: Element | Window) {
		if (this._parentScroll === value) {
			return;
		}

		this.revertParentOverscroll();
		this._parentScroll = value;
		this.addScrollEventHandlers();

		const scrollElement = this.getScrollElement();
		if (scrollElement !== this.element.nativeElement) {
			this.oldParentScrollOverflow = { x: scrollElement.style['overflow-x'], y: scrollElement.style['overflow-y'] };
			scrollElement.style['overflow-y'] = this.horizontal ? 'visible' : 'auto';
			scrollElement.style['overflow-x'] = this.horizontal ? 'auto' : 'visible';
		}
	}

	@Output()
	public update: EventEmitter<any[]> = new EventEmitter<any[]>();
	@Output()
	public vsUpdate: EventEmitter<any[]> = new EventEmitter<any[]>();

	@Output()
	public change: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();
	@Output()
	public vsChange: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@Output()
	public start: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();
	@Output()
	public vsStart: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

	@Output()
	public end: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();
	@Output()
	public vsEnd: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

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
		this.revertParentOverscroll();
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
		this.refresh_internal(true);
	}

	public scrollInto(item: any, alignToBeginning: boolean = true, additionalOffset: number = 0, animationMilliseconds: number = undefined, animationCompletedCallback: () => void = undefined) {
		let index: number = this.items.indexOf(item);
		if (index === -1) {
			return;
		}

		this.scrollToIndex(index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback);
	}

	public scrollToIndex(index: number, alignToBeginning: boolean = true, additionalOffset: number = 0, animationMilliseconds: number = undefined, animationCompletedCallback: () => void = undefined) {
		let maxRetries: number = 5;

		let retryIfNeeded = () => {
			--maxRetries;
			if (maxRetries <= 0) {
				if (animationCompletedCallback) {
					animationCompletedCallback();
				}
				return;
			}

			let dimensions = this.calculateDimensions();
			let desiredStartIndex = Math.min(Math.max(index, 0), dimensions.itemCount - 1);
			if (this.previousViewPort.startIndex === desiredStartIndex) {
				if (animationCompletedCallback) {
					animationCompletedCallback();
				}
				return;
			}

			this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, 0, retryIfNeeded);
		};

		this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, animationMilliseconds, retryIfNeeded);
	}

	protected scrollToIndex_internal(index: number, alignToBeginning: boolean = true, additionalOffset: number = 0, animationMilliseconds: number = undefined, animationCompletedCallback: () => void = undefined) {
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
			this.refresh_internal(false, animationCompletedCallback);
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
				this.refresh_internal(false);
			})
			.onStop(() => {
				cancelAnimationFrame(animationRequest);
			})
			.start();

		const animate = (time?: number) => {
			if (!newTween["isPlaying"]()) {
				return;
			}

			newTween.update(time);
			if (tweenConfigObj.scroll === scroll) {
				this.refresh_internal(false, animationCompletedCallback);
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
		this.scrollThrottlingTime = 0;
		this.resetWrapGroupDimensions();
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
			if (boundingRect.width > 0 && boundingRect.height > 0) {
				this.refresh_internal(false);
			}
		}
	}

	protected _invisiblePaddingProperty;
	protected _offsetType;
	protected _scrollType;
	protected _pageOffsetType;
	protected _childScrollDim;
	protected _translateDir;
	protected _marginDir;
	protected updateDirection(): void {
		if (this.horizontal) {
			this._invisiblePaddingProperty = 'width';
			this._offsetType = 'offsetLeft';
			this._pageOffsetType = 'pageXOffset';
			this._childScrollDim = 'childWidth';
			this._marginDir = 'margin-left';
			this._translateDir = 'translateX';
			this._scrollType = 'scrollLeft';
		}
		else {
			this._invisiblePaddingProperty = 'height';
			this._offsetType = 'offsetTop';
			this._pageOffsetType = 'pageYOffset';
			this._childScrollDim = 'childHeight';
			this._marginDir = 'margin-top';
			this._translateDir = 'translateY';
			this._scrollType = 'scrollTop';
		}
	}

	protected refresh_throttled: () => void;

	protected throttleTrailing(func: Function, wait: number): Function {
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

		return result;
	}

	protected calculatedScrollbarWidth: number = 0;
	protected calculatedScrollbarHeight: number = 0;

	protected padding: number = 0;
	protected previousViewPort: IViewport = <any>{};
	protected currentTween: tween.Tween;
	protected cachedItemsLength: number;

	protected disposeScrollHandler: () => void | undefined;
	protected disposeResizeHandler: () => void | undefined;

	protected refresh_internal(itemsArrayModified: boolean, refreshCompletedCallback: () => void = undefined, maxRunTimes: number = 2) {
		//note: maxRunTimes is to force it to keep recalculating if the previous iteration caused a re-render (different sliced items in viewport or scrollPosition changed).
		//The default of 2x max will probably be accurate enough without causing too large a performance bottleneck
		//The code would typically quit out on the 2nd iteration anyways. The main time it'd think more than 2 runs would be necessary would be for vastly different sized child items or if this is the 1st time the items array was initialized.
		//Without maxRunTimes, If the user is actively scrolling this code would become an infinite loop until they stopped scrolling. This would be okay, except each scroll event would start an additional infinte loop. We want to short-circuit it to prevent his.

		this.zone.runOutsideAngular(() => {
			requestAnimationFrame(() => {

				if (itemsArrayModified) {
					this.resetWrapGroupDimensions();
				}
				let viewport = this.calculateViewport();

				let startChanged = itemsArrayModified || viewport.startIndex !== this.previousViewPort.startIndex;
				let endChanged = itemsArrayModified || viewport.endIndex !== this.previousViewPort.endIndex;
				let scrollLengthChanged = viewport.scrollLength !== this.previousViewPort.scrollLength;
				let paddingChanged = viewport.padding !== this.previousViewPort.padding;

				this.previousViewPort = viewport;

				if (scrollLengthChanged) {
					this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, this._invisiblePaddingProperty, `${viewport.scrollLength}px`);
				}

				if (paddingChanged) {
					if (this.useMarginInsteadOfTranslate) {
						this.renderer.setStyle(this.contentElementRef.nativeElement, this._marginDir, `${viewport.padding}px`);
					}
					else {
						this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `${this._translateDir}(${viewport.padding}px)`);
						this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${viewport.padding}px)`);
					}
				}

				let emitIndexChangedEvents = true; // maxReRunTimes === 1 (would need to still run if didn't update if previous iteration had updated)

				if (startChanged || endChanged) {
					this.zone.run(() => {

						// update the scroll list to trigger re-render of components in viewport
						this.viewPortItems = viewport.startIndexWithBuffer >= 0 && viewport.endIndexWithBuffer >= 0 ? this.items.slice(viewport.startIndexWithBuffer, viewport.endIndexWithBuffer + 1) : [];
						this.update.emit(this.viewPortItems);
						this.vsUpdate.emit(this.viewPortItems);

						if (emitIndexChangedEvents) {
							if (startChanged) {
								this.start.emit({ start: viewport.startIndex, end: viewport.endIndex });
								this.vsStart.emit({ start: viewport.startIndex, end: viewport.endIndex });
							}

							if (endChanged) {
								this.end.emit({ start: viewport.startIndex, end: viewport.endIndex });
								this.vsEnd.emit({ start: viewport.startIndex, end: viewport.endIndex });
							}

							if (startChanged || endChanged) {
								this.change.emit({ start: viewport.startIndex, end: viewport.endIndex });
								this.vsChange.emit({ start: viewport.startIndex, end: viewport.endIndex });
							}
						}

						if (maxRunTimes > 0) {
							this.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
							return;
						}

						if (refreshCompletedCallback) {
							refreshCompletedCallback();
						}
					});
				} else {
					if (maxRunTimes > 0 && (scrollLengthChanged || paddingChanged)) {
						this.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
						return;
					}

					if (refreshCompletedCallback) {
						refreshCompletedCallback();
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
				this.disposeScrollHandler = this.renderer.listen('window', 'scroll', this.refresh_throttled);
				this.disposeResizeHandler = this.renderer.listen('window', 'resize', this.refresh_throttled);
			}
			else {
				this.disposeScrollHandler = this.renderer.listen(scrollElement, 'scroll', this.refresh_throttled);
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
		let children = ((this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement).children;

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

	protected minMeasuredChildWidth: number;
	protected minMeasuredChildHeight: number;

	protected wrapGroupDimensions: WrapGroupDimensions;

	protected resetWrapGroupDimensions(): void {
		const oldWrapGroupDimensions = this.wrapGroupDimensions;
		this.wrapGroupDimensions = {
			maxChildSizePerWrapGroup: [],
			numberOfKnownWrapGroupChildSizes: 0,
			sumOfKnownWrapGroupChildWidths: 0,
			sumOfKnownWrapGroupChildHeights: 0
		};

		if (!this.enableUnequalChildrenSizes || !oldWrapGroupDimensions || oldWrapGroupDimensions.numberOfKnownWrapGroupChildSizes === 0) {
			return;
		}

		const itemsPerWrapGroup: number = this.countItemsPerWrapGroup();
		for (let wrapGroupIndex = 0; wrapGroupIndex < oldWrapGroupDimensions.maxChildSizePerWrapGroup.length; ++wrapGroupIndex) {
			const oldWrapGroupDimension: WrapGroupDimension = oldWrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
			if (!oldWrapGroupDimension || !oldWrapGroupDimension.items || !oldWrapGroupDimension.items.length) {
				continue;
			}

			if (oldWrapGroupDimension.items.length !== itemsPerWrapGroup) {
				return;
			}

			let itemsChanged = false;
			let arrayStartIndex = itemsPerWrapGroup * wrapGroupIndex;
			for (let i = 0; i < itemsPerWrapGroup; ++i) {
				if (!this.compareItems(oldWrapGroupDimension.items[i], this.items[arrayStartIndex + i])) {
					itemsChanged = true;
					break;
				}
			}

			if (!itemsChanged) {
				++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
				this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += oldWrapGroupDimension.childWidth || 0;
				this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += oldWrapGroupDimension.childHeight || 0;
				this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = oldWrapGroupDimension;
			}
		}
	}

	protected calculateDimensions(): IDimensions {
		let scrollElement = this.getScrollElement();
		let itemCount = this.items.length;

		const maxCalculatedScrollBarSize: number = 25; // Note: Formula to auto-calculate doesn't work for ParentScroll, so we default to this if not set by consuming application
		this.calculatedScrollbarHeight = Math.max(Math.min(scrollElement.offsetHeight - scrollElement.clientHeight, maxCalculatedScrollBarSize), this.calculatedScrollbarHeight);
		this.calculatedScrollbarWidth = Math.max(Math.min(scrollElement.offsetWidth - scrollElement.clientWidth, maxCalculatedScrollBarSize), this.calculatedScrollbarWidth);

		let viewWidth = scrollElement.offsetWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth || (this.horizontal ? 0 : maxCalculatedScrollBarSize));
		let viewHeight = scrollElement.offsetHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight || (this.horizontal ? maxCalculatedScrollBarSize : 0));

		let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;

		let itemsPerWrapGroup = this.countItemsPerWrapGroup();
		let wrapGroupsPerPage;

		let defaultChildWidth;
		let defaultChildHeight;

		if (!this.enableUnequalChildrenSizes) {
			if (content.children.length > 0) {
				if (!this.childWidth || !this.childHeight) {
					if (!this.minMeasuredChildWidth && viewWidth > 0) {
						this.minMeasuredChildWidth = viewWidth;
					}
					if (!this.minMeasuredChildHeight && viewHeight > 0) {
						this.minMeasuredChildHeight = viewHeight;
					}
				}

				let child = content.children[0];
				let clientRect = child.getBoundingClientRect();
				this.minMeasuredChildWidth = Math.min(this.minMeasuredChildWidth, clientRect.width);
				this.minMeasuredChildHeight = Math.min(this.minMeasuredChildHeight, clientRect.height);
			}

			defaultChildWidth = this.childWidth || this.minMeasuredChildWidth || viewWidth;
			defaultChildHeight = this.childHeight || this.minMeasuredChildHeight || viewHeight;
			let itemsPerRow = Math.max(Math.ceil(viewWidth / defaultChildWidth), 1);
			let itemsPerCol = Math.max(Math.ceil(viewHeight / defaultChildHeight), 1);
			wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
		} else {
			let scrollOffset = scrollElement[this._scrollType] - (this.previousViewPort ? this.previousViewPort.padding : 0);
			
			let arrayStartIndex = this.previousViewPort.startIndexWithBuffer || 0;
			let wrapGroupIndex = Math.ceil(arrayStartIndex / itemsPerWrapGroup);

			let maxWidthForWrapGroup = 0;
			let maxHeightForWrapGroup = 0;
			let sumOfVisibleMaxWidths = 0;
			let sumOfVisibleMaxHeights = 0;
			wrapGroupsPerPage = 0;

			for (let i = 0; i < content.children.length; ++i) {
				++arrayStartIndex;
				let child = content.children[i];
				let clientRect = child.getBoundingClientRect();

				maxWidthForWrapGroup = Math.max(maxWidthForWrapGroup, clientRect.width);
				maxHeightForWrapGroup = Math.max(maxHeightForWrapGroup, clientRect.height);

				if (arrayStartIndex % itemsPerWrapGroup === 0) {
					let oldValue = this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
					if (oldValue) {
						--this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
						this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= oldValue.childWidth || 0;
						this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= oldValue.childHeight || 0;
					}

					++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
					const items = this.items.slice(arrayStartIndex - itemsPerWrapGroup, arrayStartIndex);
					this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = {
						childWidth: maxWidthForWrapGroup,
						childHeight: maxHeightForWrapGroup,
						items: items
					};
					this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += maxWidthForWrapGroup;
					this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += maxHeightForWrapGroup;

					if (this.horizontal) {
						let maxVisibleWidthForWrapGroup = Math.min(maxWidthForWrapGroup, Math.max(viewWidth - sumOfVisibleMaxWidths, 0));
						if (scrollOffset > 0) {
							let scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleWidthForWrapGroup);
							maxVisibleWidthForWrapGroup -= scrollOffsetToRemove;
							scrollOffset -= scrollOffsetToRemove;
						}

						sumOfVisibleMaxWidths += maxVisibleWidthForWrapGroup;
						if (maxVisibleWidthForWrapGroup > 0 && viewWidth >= sumOfVisibleMaxWidths) {
							++wrapGroupsPerPage;
						}
					} else {
						let maxVisibleHeightForWrapGroup = Math.min(maxHeightForWrapGroup, Math.max(viewHeight - sumOfVisibleMaxHeights, 0));
						if (scrollOffset > 0) {
							let scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleHeightForWrapGroup);
							maxVisibleHeightForWrapGroup -= scrollOffsetToRemove;
							scrollOffset -= scrollOffsetToRemove;
						}

						sumOfVisibleMaxHeights += maxVisibleHeightForWrapGroup;
						if (maxVisibleHeightForWrapGroup > 0 && viewHeight >= sumOfVisibleMaxHeights) {
							++wrapGroupsPerPage;
						}
					}

					++wrapGroupIndex;

					maxWidthForWrapGroup = 0;
					maxHeightForWrapGroup = 0;
				}
			}

			let averageChildWidth = this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths / this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
			let averageChildHeight = this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights / this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
			defaultChildWidth = this.childWidth || averageChildWidth || viewWidth;
			defaultChildHeight = this.childHeight || averageChildHeight || viewHeight;

			if (this.horizontal) {
				if (viewWidth > sumOfVisibleMaxWidths) {
					wrapGroupsPerPage += Math.ceil((viewWidth - sumOfVisibleMaxWidths) / defaultChildWidth);
				}
			} else {
				if (viewHeight > sumOfVisibleMaxHeights) {
					wrapGroupsPerPage += Math.ceil((viewHeight - sumOfVisibleMaxHeights) / defaultChildHeight);
				}
			}
		}

		let itemsPerPage = itemsPerWrapGroup * wrapGroupsPerPage;
		let pageCount_fractional = itemCount / itemsPerPage;
		let numberOfWrapGroups = Math.ceil(itemCount / itemsPerWrapGroup);

		let scrollLength = 0;

		let defaultScrollLengthPerWrapGroup = this.horizontal ? defaultChildWidth : defaultChildHeight;
		if (this.enableUnequalChildrenSizes) {
			let numUnknownChildSizes = 0;
			for (let i = 0; i < numberOfWrapGroups; ++i) {
				let childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] && this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
				if (childSize) {
					scrollLength += childSize;
				} else {
					++numUnknownChildSizes;
				}
			}

			scrollLength += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);
		} else {
			scrollLength = numberOfWrapGroups * defaultScrollLengthPerWrapGroup;
		}

		return {
			itemCount: itemCount,
			itemsPerWrapGroup: itemsPerWrapGroup,
			wrapGroupsPerPage: wrapGroupsPerPage,
			itemsPerPage: itemsPerPage,
			pageCount_fractional: pageCount_fractional,
			childWidth: defaultChildWidth,
			childHeight: defaultChildHeight,
			scrollLength: scrollLength
		};
	}

	protected cachedPageSize: number = 0;
	protected previousScrollNumberElements: number = 0;

	protected calculatePadding(arrayStartIndexWithBuffer: number, dimensions: IDimensions, allowUnequalChildrenSizes_Experimental: boolean): number {
		if (dimensions.itemCount === 0) {
			return 0;
		}

		let defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
		let startingWrapGroupIndex = Math.ceil(arrayStartIndexWithBuffer / dimensions.itemsPerWrapGroup) || 0;

		if (!this.enableUnequalChildrenSizes) {
			return defaultScrollLengthPerWrapGroup * startingWrapGroupIndex;
		}

		let numUnknownChildSizes = 0;
		let result = 0;
		for (let i = 0; i < startingWrapGroupIndex; ++i) {
			let childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] && this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
			if (childSize) {
				result += childSize;
			} else {
				++numUnknownChildSizes;
			}
		}
		result += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);

		return result;
	}

	protected calculatePageInfo(scrollPosition: number, dimensions: IDimensions): IPageInfoWithBuffer {
		let scrollPercentage = 0;
		if (this.enableUnequalChildrenSizes) {
			const numberOfWrapGroups = Math.ceil(dimensions.itemCount / dimensions.itemsPerWrapGroup);
			let totalScrolledLength = 0;
			let defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
			for (let i = 0; i < numberOfWrapGroups; ++i) {
				let childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] && this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
				if (childSize) {
					totalScrolledLength += childSize;
				} else {
					totalScrolledLength += defaultScrollLengthPerWrapGroup;
				}

				if (scrollPosition < totalScrolledLength) {
					scrollPercentage = i / numberOfWrapGroups;
					break;
				}
			}
		} else {
			scrollPercentage = scrollPosition / dimensions.scrollLength;
		}

		let startingArrayIndex_fractional = Math.min(Math.max(scrollPercentage * dimensions.pageCount_fractional, 0), dimensions.pageCount_fractional) * dimensions.itemsPerPage;

		let maxStart = dimensions.itemCount - dimensions.itemsPerPage - 1;
		let arrayStartIndex = Math.min(Math.floor(startingArrayIndex_fractional), maxStart);
		arrayStartIndex -= arrayStartIndex % dimensions.itemsPerWrapGroup; // round down to start of wrapGroup

		let arrayEndIndex = Math.ceil(startingArrayIndex_fractional) + dimensions.itemsPerPage - 1;
		arrayEndIndex += (dimensions.itemsPerWrapGroup - ((arrayEndIndex + 1) % dimensions.itemsPerWrapGroup)); // round up to end of wrapGroup

		if (isNaN(arrayStartIndex)) {
			arrayStartIndex = 0;
		}
		if (isNaN(arrayEndIndex)) {
			arrayEndIndex = 0;
		}

		arrayStartIndex = Math.min(Math.max(arrayStartIndex, 0), dimensions.itemCount - 1);
		arrayEndIndex = Math.min(Math.max(arrayEndIndex, 0), dimensions.itemCount - 1);

		let bufferSize = this.bufferAmount * dimensions.itemsPerWrapGroup;
		let startIndexWithBuffer = Math.min(Math.max(arrayStartIndex - bufferSize, 0), dimensions.itemCount - 1);
		let endIndexWithBuffer = Math.min(Math.max(arrayEndIndex + bufferSize, 0), dimensions.itemCount - 1);

		return {
			startIndex: arrayStartIndex,
			endIndex: arrayEndIndex,
			startIndexWithBuffer: startIndexWithBuffer,
			endIndexWithBuffer: endIndexWithBuffer
		};
	}

	protected calculateViewport(): IViewport {
		let dimensions = this.calculateDimensions();
		let offset = this.getElementsOffset();

		let scrollPosition = this.getScrollPosition();
		if (scrollPosition > dimensions.scrollLength && !(this.parentScroll instanceof Window)) {
			scrollPosition = dimensions.scrollLength;
		} else {
			scrollPosition -= offset;
		}
		scrollPosition = Math.max(0, scrollPosition);

		let pageInfo = this.calculatePageInfo(scrollPosition, dimensions);
		let newPadding = this.calculatePadding(pageInfo.startIndexWithBuffer, dimensions, true);
		let newScrollLength = dimensions.scrollLength;

		return {
			startIndex: pageInfo.startIndex,
			endIndex: pageInfo.endIndex,
			startIndexWithBuffer: pageInfo.startIndexWithBuffer,
			endIndexWithBuffer: pageInfo.endIndexWithBuffer,
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
