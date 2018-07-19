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
  scrollAnimationTime: number = 1500;

  @Input()
  doNotCheckAngularZone: boolean = false;

  private _items: any[] = [];
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

  private _horizontal: boolean;
  private _offsetType;
  private _scrollType;
  private _pageOffsetType;
  private _scrollDim;
  private _itemsPerScrollDir;
  private _itemsPerOpScrollDir;
  private _childScrollDim;
  private _translateDir;
  @Input() set horizontal(value: boolean) {
    this._horizontal = value;
	this.updateDirection();
  }
  get horizontal(): boolean {
    return this._horizontal;
  }

  private updateDirection(): void {
    if (this._horizontal) {
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
  
  private refreshHandler = () => {
    this.refresh();
  };
  private _parentScroll: Element | Window;
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

  @ContentChild('container')
  containerElementRef: ElementRef;

  previousStart: number;
  previousEnd: number;
  startupLoop: boolean = true;
  currentTween: any;
  itemsLength: number;
  
  public window = window;

  private disposeScrollHandler: () => void | undefined;
  private disposeResizeHandler: () => void | undefined;

  /** Cache of the last scroll height to prevent setting CSS when not needed. */
  private lastScrollHeight = -1;
  private lastScrollWidth = -1;

  /** Cache of the last top padding to prevent setting CSS when not needed. */
  private lastPadding = -1;


  constructor(
    private readonly element: ElementRef,
    private readonly renderer: Renderer2,
    private readonly zone: NgZone) {
		this.horizontal = false;
	}

  ngOnInit() {
    this.addScrollEventHandlers();
  }

  ngOnDestroy() {
    this.removeScrollEventHandlers();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.previousStart = undefined;
    this.previousEnd = undefined;
    const items = (changes as any).items || {};
    if ((changes as any).items != undefined && items.previousValue == undefined || (items.previousValue != undefined && items.previousValue.length === 0)) {
      this.startupLoop = true;
      this.itemsLength = this.items.length;
    }
    this.refresh();
  }

  ngDoCheck() {
    if (this.items && this.itemsLength != this.items.length) {
      this.previousStart = undefined;
      this.previousEnd = undefined;
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

  private getScrollElement(): HTMLElement {
	  return this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
  }
  
  scrollInto(item: any) {
    let el = this.getScrollElement();
    let offset = this.getElementsOffset();
    let index: number = (this.items || []).indexOf(item);
    if (index < 0 || index >= (this.items || []).length) return;

    let d = this.calculateDimensions();
    let scroll = (Math.floor(index / d[this._itemsPerOpScrollDir]) * d[this._childScrollDim])
      - (d[this._childScrollDim] * Math.min(index, this.bufferAmount));

    let animationRequest;

    if (this.currentTween != undefined) this.currentTween.stop();
    // totally disable animate
    if(!this.scrollAnimationTime){
        el[this._scrollType] = scroll;
        return;
    }

    const tweenConfigObj = {};
    tweenConfigObj[this._scrollType] = el[this._scrollType];

    const tweenScrollTo = {}
    tweenScrollTo[this._scrollType] = scroll;
    this.currentTween = new tween.Tween(tweenConfigObj)
      .to(tweenScrollTo, this.scrollAnimationTime)
      .easing(tween.Easing.Quadratic.Out)
      .onUpdate((data) => {
        if (isNaN(data[this._scrollType])) {
          return;
        }
        this.renderer.setProperty(el, this._scrollType, data[this._scrollType]);
        this.refresh();
      })
      .onStop(() => {
        cancelAnimationFrame(animationRequest);
      })
      .start();

    const animate = (time?) => {
      this.currentTween.update(time);
      if (this.currentTween._object[this._scrollType] !== scroll) {
        this.zone.runOutsideAngular(() => {
            animationRequest = requestAnimationFrame(animate);
        });
      }
    };

    animate()
  }

  private addScrollEventHandlers() {
	let scrollElement = this.getScrollElement();

    this.removeScrollEventHandlers();
    if (!scrollElement) {
		return;
	}

	this.zone.runOutsideAngular(() => {
		if (scrollElement === document.body) {
			this.disposeScrollHandler = this.renderer.listen('window', 'scroll', this.refreshHandler);
			this.disposeResizeHandler = this.renderer.listen('window', 'resize', this.refreshHandler);
		}
		else {
			this.disposeScrollHandler = this.renderer.listen(scrollElement, 'scroll', this.refreshHandler);	
		}
	});
  }

  private removeScrollEventHandlers() {
    if (this.disposeScrollHandler) {
      this.disposeScrollHandler();
      this.disposeScrollHandler = undefined;
    }
    if (this.disposeResizeHandler) {
      this.disposeResizeHandler();
      this.disposeResizeHandler = undefined;
    }
  }

  private countItemsPerRow() {
    let offsetTop;
    let itemsPerRow;
    let children = this.contentElementRef.nativeElement.children;
    for (itemsPerRow = 0; itemsPerRow < children.length; itemsPerRow++) {
      if (offsetTop != undefined && offsetTop !== children[itemsPerRow].offsetTop) break;
      offsetTop = children[itemsPerRow].offsetTop;
    }
    return itemsPerRow;
  }

    private countItemsPerCol() {
        let offsetLeft;
        let itemsPerCol;
        let children = this.contentElementRef.nativeElement.children;
        for (itemsPerCol = 0; itemsPerCol < children.length; itemsPerCol++) {
            if (offsetLeft != undefined && offsetLeft !== children[itemsPerCol].offsetLeft) break;
            offsetLeft = children[itemsPerCol].offsetLeft;
        }
        return itemsPerCol;
    }

  private getElementsOffset(): number {
    let offset = 0;
    if (this.containerElementRef && this.containerElementRef.nativeElement) {
      offset += this.containerElementRef.nativeElement[this._offsetType];
    }
    if (this.parentScroll) {
      offset += this.element.nativeElement[this._offsetType];
    }
    return offset;
  }

  private getScrollValue(): number {
	  if (this.parentScroll instanceof Window) {
		  return window[this._pageOffsetType] || document.documentElement[this._scrollType] || document.body[this._scrollType] || 0;
	  }
	  
	  return this.getScrollElement()[this._scrollType];
  }
  
  private calculateDimensions() {
    let el = this.getScrollElement();
    let items = this.items || [];
    let itemCount = items.length;
	
	if (!this.scrollbarWidth) {
		this.scrollbarWidth = el.offsetWidth - el.clientWidth;
	}
	if (!this.scrollbarHeight) {
		this.scrollbarHeight = el.offsetHeight - el.clientHeight;
	}
	
    let viewWidth = el.clientWidth - this.scrollbarWidth;
    let viewHeight = el.clientHeight - this.scrollbarHeight;

    let contentDimensions;
    if (this.childWidth == undefined || this.childHeight == undefined) {
      let content = this.contentElementRef.nativeElement;
      if (this.containerElementRef && this.containerElementRef.nativeElement) {
        content = this.containerElementRef.nativeElement;
      }
      contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
        width: viewWidth,
        height: viewHeight
      };
    }
    let childWidth = this.childWidth || contentDimensions.width;
    let childHeight = this.childHeight || contentDimensions.height;

    let itemsPerCol = -1;
    let itemsPerColByCalc = -1;
    let itemsPerRow = -1;
    let itemsPerRowByCalc = -1;

    if (this.horizontal) {
      itemsPerCol = Math.max(1, this.countItemsPerCol());
      itemsPerColByCalc = Math.max(1, Math.floor(viewHeight / childHeight));
      itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
    } else {
      itemsPerRow = Math.max(1, this.countItemsPerRow());
      itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
      itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
    }

    let elScroll = this.getScrollValue();

    let scroll = Math.max(0, elScroll);

    const scrollHeight = childHeight * Math.ceil(itemCount / itemsPerRow);
    const scrollWidth = childWidth * Math.ceil(itemCount / itemsPerCol);
    if (!this.horizontal && itemsPerCol === 1 && Math.floor(scroll / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
      itemsPerRow = itemsPerRowByCalc;
    }
    // only re-assign in case of horizontal to prevent
    if (this.horizontal && itemsPerRow === 1 && Math.floor(scroll /scrollWidth * itemCount) + itemsPerColByCalc >= itemCount ) {
      itemsPerCol = itemsPerColByCalc;
    }

    if (scrollHeight !== this.lastScrollHeight && !this.horizontal) {
      this.renderer.setStyle(this.shimElementRef.nativeElement, 'height', `${scrollHeight}px`);
      this.lastScrollHeight = scrollHeight;
    }

    if (scrollWidth !== this.lastScrollWidth && this.horizontal) {
      this.renderer.setStyle(this.shimElementRef.nativeElement, 'width', `${scrollWidth}px`);
      this.lastScrollWidth = scrollWidth;
    }

    return {
      itemCount: itemCount,
      viewWidth: viewWidth,
      viewHeight: viewHeight,
      childWidth: childWidth,
      childHeight: childHeight,
      itemsPerRow: itemsPerRow,
      itemsPerCol: itemsPerCol,
      itemsPerRowByCalc: itemsPerRowByCalc,
      itemsPerColByCalc : itemsPerColByCalc,
      scrollHeight,
      scrollWidth
    };
  }

  private calculateItems(forceViewportUpdate: boolean = false) {
    if (!this.doNotCheckAngularZone) {
      NgZone.assertNotInAngularZone();
    }
    let el = this.getScrollElement();

    let d = this.calculateDimensions();
    let items = this.items || [];
    let offset = this.getElementsOffset();
    let elScroll = this.getScrollValue();
    if (elScroll > d[this._scrollDim] && !(this.parentScroll instanceof Window)) {
      elScroll = d[this._scrollDim] + offset;
    }

    let scroll = Math.max(0, elScroll - offset);
    let indexByScroll = scroll / d[this._scrollDim] * d.itemCount / ((this.horizontal) ? d.itemsPerCol : d.itemsPerRow);


    let end = Math.min(d.itemCount, Math.ceil(indexByScroll) * d[this._itemsPerOpScrollDir] + d[this._itemsPerOpScrollDir] * (d[this._itemsPerScrollDir] + 1));

    let maxStartEnd = end;
    const modEnd = end % d[this._itemsPerOpScrollDir];
    if (modEnd) {
      maxStartEnd = end + d[this._itemsPerOpScrollDir] - modEnd;
    }
    let maxStart = Math.max(0, maxStartEnd - d[this._itemsPerScrollDir] * d[this._itemsPerOpScrollDir] - d[this._itemsPerOpScrollDir]);
    let start = Math.min(maxStart, Math.floor(indexByScroll) * d[this._itemsPerOpScrollDir]);


    const dirPadding = (items == null || items.length === 0) ? 0 :
        (d[this._childScrollDim] * Math.ceil(start / d[this._itemsPerOpScrollDir]) -
            (d[this._childScrollDim] * Math.min(start, this.bufferAmount)));

    if (dirPadding !== this.lastPadding) {
      this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `${this._translateDir}(${dirPadding}px)`);
      this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `${this._translateDir}(${dirPadding}px)`);
      this.lastPadding = dirPadding;
    }

    start = !isNaN(start) ? start : -1;
    end = !isNaN(end) ? end : -1;
    start -= this.bufferAmount;
    start = Math.max(0, start);
    end += this.bufferAmount;
    end = Math.min(items.length, end);
    if (start !== this.previousStart || end !== this.previousEnd || forceViewportUpdate === true) {

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

        if (this.startupLoop === true) {
          this.refresh();
        } else {
          this.change.emit({ start, end });
        }
      });

    } else if (this.startupLoop === true) {
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
