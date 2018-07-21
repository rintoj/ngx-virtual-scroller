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

	private calculatedScrollbarWidth: number = 0;
	private calculatedScrollbarHeight: number = 0;

	@Input()
	enableUnequalChildrenSizes_Experimental: boolean = false;

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

	@ViewChild('invisiblePadding', { read: ElementRef })
	invisiblePaddingElementRef: ElementRef;

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

	/** Cache of the last padding to prevent setting CSS when not needed. */
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
		if (this.itemsLength !== this.items.length) {
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
		let scrollElement = this.getScrollElement();
		let offset = this.getElementsOffset();
		let index: number = this.items.indexOf(item);
		if (index === -1) {
			return;
		}

		let dimensions = this.calculateDimensions();
		let scroll = ((Math.floor(index / dimensions[this._itemsPerOpScrollDir]) - Math.min(index, this.bufferAmount)) * dimensions[this._childScrollDim]) + offset + additionalOffset;

		/*
		 //bottom
		 this.element.nativeElement.scrollTop = Math.floor(index / d.itemsPerRow) * - d.childHeight - Math.max(0, (d.itemsPerCol - 1)) * d.childHeight;

		 //top
+    this.element.nativeElement.scrollTop = Math.floor(index / d.itemsPerRow) * d.childHeight;
		 */

		let animationRequest: number;

		if (this.currentTween) {
			this.currentTween.stop();
			this.currentTween = undefined;
		}

		// totally disable animate
		if (!this.scrollAnimationTime) {
			scrollElement[this._scrollType] = scroll;
			return;
		}

		const tweenConfigObj = { scroll: scrollElement[this._scrollType] };

		let newTween = new tween.Tween(tweenConfigObj)
			.to({ scroll }, this.scrollAnimationTime)
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

	protected calculateDimensions() {
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

			scrollHeight = Math.ceil((childHeight * (itemCount - this.previousEnd) + sumOfCurrentChildHeight) / itemsPerRow + this.lastPadding);
			scrollWidth = Math.ceil((childWidth * (itemCount - this.previousEnd) + sumOfCurrentChildWidth) / itemsPerCol + this.lastPadding);
		}

		if (this.horizontal) {
			if (itemsPerRow === 1 && Math.floor(scroll / scrollWidth * itemCount) + itemsPerColByCalc >= itemCount) {
				itemsPerCol = itemsPerColByCalc;
			}
			if (scrollWidth !== this.lastScrollWidth) {
				this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, 'width', `${scrollWidth}px`);
				this.lastScrollWidth = scrollWidth;
			}
		}
		else {
			if (itemsPerCol === 1 && Math.floor(scroll / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
				itemsPerRow = itemsPerRowByCalc;
			}
			if (scrollHeight !== this.lastScrollHeight) {
				this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, 'height', `${scrollHeight}px`);
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
		let dimensions = this.calculateDimensions();
		let offset = this.getElementsOffset();
		let elScroll = this.getScrollValue();
		if (elScroll > dimensions[this._scrollDim] && !(this.parentScroll instanceof Window)) {
			elScroll = dimensions[this._scrollDim] + offset;
		}

		let scroll = Math.max(0, elScroll - offset);
		let content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;

		let newStart;
		let newEnd;

		if (this.enableUnequalChildrenSizes_Experimental) {
			let indexByScroll = this.previousStart / dimensions[this._itemsPerOpScrollDir];
			if (this.lastPadding > scroll) {
				// scroll up
				indexByScroll -= (this.lastPadding - scroll) / dimensions[this._childScrollDim];
			} else {
				// scroll down

				let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

				let paddingCurrent = this.lastPadding;
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
		newStart = Math.max(0, newStart);
		newEnd += this.bufferAmount;
		newEnd = Math.min(this.items.length, newEnd);

		let newPadding: number = this.lastPadding;

		if (this.enableUnequalChildrenSizes_Experimental) {
			if (newStart === 0) {
				newPadding = 0;
				this.previousStart = 0;
			} else {

				let childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;

				if (!childSizeOverride &&
					this.previousPageSize &&
					this.previousScrollNumberElements &&
					content.children[this.previousScrollNumberElements - dimensions[this._itemsPerOpScrollDir]]) {
					let firstChild = content.children[0].getBoundingClientRect();
					let lastChild = content.children[this.previousScrollNumberElements - dimensions[this._itemsPerOpScrollDir]]
						.getBoundingClientRect();
					newPadding -= (this.horizontal ? lastChild.right : lastChild.bottom) -
						(this.horizontal ? firstChild.left : firstChild.top) -
						this.previousPageSize;
					this.previousPageSize = 0;
					this.previousScrollNumberElements = 0;
				}

				if (newStart < this.previousStart) {
					this.previousPageSize = 0;

					let childSizeHash = this.horizontal ? this.itemsWidth : this.itemsHeight;
					let defaultChildSize = dimensions[this._childScrollDim];

					let maxChildSize = 0;
					for (let i = newStart; i < this.previousStart; ++i) {
						maxChildSize = Math.max(maxChildSize, childSizeHash[i] || defaultChildSize);
						if ((i + 1) % dimensions[this._itemsPerOpScrollDir] === 0) {
							this.previousPageSize += maxChildSize * dimensions[this._itemsPerOpScrollDir];
							maxChildSize = 0;
						}
					}

					this.previousPageSize /= dimensions[this._itemsPerOpScrollDir];
					newPadding -= this.previousPageSize;

					this.previousScrollNumberElements = this.previousStart - newStart;
				} else {
					newPadding += dimensions[this._childScrollDim] *
						(newStart - this.previousStart) /
						dimensions[this._itemsPerOpScrollDir];
				}

				newPadding = Math.round(newPadding);
			}
		} else {
			newPadding = this.items.length === 0 ? 0 : (dimensions[this._childScrollDim] * Math.ceil(newStart / dimensions[this._itemsPerOpScrollDir]) - (dimensions[this._childScrollDim] * Math.min(newStart, this.bufferAmount)));
		}

		if (newPadding !== this.lastPadding) {
			this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `${this._translateDir}(${newPadding}px)`);
			this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${newPadding}px)`);
			this.lastPadding = newPadding;
		}

		if (newStart !== this.previousStart || newEnd !== this.previousEnd || forceViewportUpdate) {
			this.zone.run(() => {

				// update the scroll list
				let _end = newEnd >= 0 ? newEnd : 0; // To prevent from accidentally selecting the entire array with a negative 1 (-1) in the end position. 
				this.viewPortItems = this.items.slice(newStart, _end);
				this.update.emit(this.viewPortItems);

				// emit 'start' event
				if (newStart !== this.previousStart && this.startupLoop === false) {
					this.start.emit({ start: newStart, end: newEnd });
				}

				// emit 'end' event
				if (newEnd !== this.previousEnd && this.startupLoop === false) {
					this.end.emit({ start: newStart, end: newEnd });
				}

				this.previousStart = newStart;
				this.previousEnd = newEnd;

				if (this.startupLoop) {
					this.refresh();
					return;
				} else {
					this.change.emit({ start: newStart, end: newEnd });
				}

				if ((this.previousPageSize && this.previousScrollNumberElements)) {
					this.refresh();
				}
			});
		} else if (this.startupLoop) {
			this.startupLoop = false;
			this.change.emit({ start: newStart, end: newEnd });
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
