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

import * as tween from '@tweenjs/tween.js';

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
    '[style.overflow-y]': "parentScroll ? 'hidden' : 'auto'"
  },
  styles: [`
    :host {
      overflow: hidden;
      position: relative;
      display: block;
      -webkit-overflow-scrolling: touch;
    }

    .scrollable-content {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
    }

    .total-padding {
      width: 1px;
      opacity: 0;
    }
  `]
})
export class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  items: any[] = [];

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
  scrollAnimationTime: number = 300;

  @Input()
  doNotCheckAngularZone: boolean = false;

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
    this.addParentEventHandlers(this._parentScroll);
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

  @ViewChild('content', {read: ElementRef})
  contentElementRef: ElementRef;

  @ViewChild('shim', {read: ElementRef})
  shimElementRef: ElementRef;

  @ContentChild('container', {read: ElementRef})
  containerElementRef: ElementRef;

  topPadding: number = 0;
  previousStart: number = 0;
  previousEnd: number = -1;
  previousChildHeight: number = 0;
  previousScrollNumberElements: number = 0;
  startupLoop: boolean = true;
  currentTween: tween.Tween;
  itemsHeight: { [key: number]: number } = {};
  window = window;

  private disposeScrollHandler: () => void | undefined;
  private disposeResizeHandler: () => void | undefined;

  /** Cache of the last scroll height to prevent setting CSS when not needed. */
  private lastScrollHeight = -1;

  /** Cache of the last top padding to prevent setting CSS when not needed. */
  private lastTopPadding = -1;

  constructor(private readonly element: ElementRef,
        private readonly renderer: Renderer2,
        private readonly zone: NgZone) {
  }

  ngOnInit() {
    this.scrollbarWidth = 0; // this.element.nativeElement.offsetWidth - this.element.nativeElement.clientWidth;
    this.scrollbarHeight = 0; // this.element.nativeElement.offsetHeight - this.element.nativeElement.clientHeight;

    if (!this.parentScroll) {
      this.addParentEventHandlers(this.element.nativeElement);
    }
  }

  ngOnDestroy() {
    this.removeParentEventHandlers();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.previousStart = 0;
    this.previousEnd = -1;
    const items = (changes as any).items || {};
    if ((changes as any).items != undefined && items.previousValue == undefined || (items.previousValue != undefined && items.previousValue.length === 0)) {
      this.startupLoop = true;
    }
    this.refresh();
  }

  refresh(forceViewportUpdate: boolean = false) {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.calculateItems(forceViewportUpdate));
    });
  }

  scrollInto(item: any, additionalOffset?: number) {
    let el: Element = this.getElement();
    let offsetTop = this.getElementsOffset();
    let index: number = (this.items || []).indexOf(item);
    if (index < 0 || index >= (this.items || []).length) return;

    let d = this.calculateDimensions();
    let scrollTop = (Math.floor(index / d.itemsPerRow) * d.childHeight) + offsetTop + (additionalOffset ? additionalOffset : 0);

    let animationRequest: number;

    if (this.currentTween != undefined) this.currentTween.stop();

    // totally disable animate
    if (!this.scrollAnimationTime) {
      el.scrollTop = scrollTop;
      return;
    }

    let scrollObj = {scrollTop: el.scrollTop};

    let currentTween = new tween.Tween(scrollObj)
      .to({scrollTop}, this.scrollAnimationTime)
      .easing(tween.Easing.Quadratic.Out)
      .onUpdate((data) => {
        if (isNaN(data.scrollTop)) {
          return;
        }
        this.renderer.setProperty(el, 'scrollTop', data.scrollTop);
        this.refresh();
      })
      .onStop(() => {
        cancelAnimationFrame(animationRequest);
      })
      .start();

    const animate = (time?: number) => {
      currentTween.update(time);
      if (scrollObj.scrollTop !== scrollTop) {
        this.zone.runOutsideAngular(() => {
          animationRequest = requestAnimationFrame(animate);
        });
      }
    };

    animate();
    this.currentTween = currentTween;
  }

  private getElement(): Element {
    if (this.parentScroll instanceof Window) {
      return document.scrollingElement || document.documentElement;
    }
    return this.parentScroll || this.element.nativeElement;
  }

  private addParentEventHandlers(parentScroll: Element | Window) {
    this.removeParentEventHandlers();
    if (parentScroll) {
      this.zone.runOutsideAngular(() => {
        this.disposeScrollHandler =
          this.renderer.listen(parentScroll, 'scroll', this.refreshHandler);
        if (parentScroll instanceof Window) {
          this.disposeResizeHandler =
            this.renderer.listen('window', 'resize', this.refreshHandler);
        }
      });
    }
  }

  private removeParentEventHandlers() {
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

  private getElementsOffset(): number {
    let offsetTop = 0;
    let scrollElement: Element = this.getElement();

    if (this.containerElementRef && this.containerElementRef.nativeElement) {
      offsetTop += this.containerElementRef.nativeElement.offsetTop;
    }
    if (this.parentScroll) {
      offsetTop += this.element.nativeElement.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top;
      if (!(this.parentScroll instanceof Window)) {
        offsetTop += scrollElement.scrollTop;
      }
    }
    return offsetTop;
  }

  private calculateDimensions() {
    let el: Element = this.getElement();
    let items = this.items || [];
    let itemCount = items.length;
    let viewWidth = el.clientWidth - this.scrollbarWidth;
    let viewHeight = el.clientHeight - this.scrollbarHeight;

    let sumOfCurrentChildHeight = 0;
    let contentDimensions;

    let content = this.contentElementRef.nativeElement;
    if (this.containerElementRef && this.containerElementRef.nativeElement) {
      content = this.containerElementRef.nativeElement;
    }

    if (this.childWidth == undefined || this.childHeight == undefined) {
      contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
        width: viewWidth,
        height: viewHeight
      };
    }

    let childWidth = this.childWidth || contentDimensions.width;
    let childHeight = this.childHeight || contentDimensions.height;

    let itemsPerRow = Math.max(1, this.countItemsPerRow());
    let i = this.previousStart;
    let maxHeightInRow = 0;

    for (let child of content.children) {
      this.itemsHeight[i] = child.getBoundingClientRect().height;
      maxHeightInRow = Math.max(maxHeightInRow, this.itemsHeight[i]);
      if (!((i + 1) % itemsPerRow)) {
        sumOfCurrentChildHeight += maxHeightInRow * itemsPerRow;
        maxHeightInRow = 0;
      }
      i++;
    }

    let itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
    let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
    let scrollTop = Math.max(0, el.scrollTop);
    const scrollHeight = Math.ceil((childHeight * (itemCount - this.previousEnd) + sumOfCurrentChildHeight) / itemsPerRow + this.topPadding);
    if (itemsPerCol === 1 && Math.floor(scrollTop / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
      itemsPerRow = itemsPerRowByCalc;
    }

    if (scrollHeight !== this.lastScrollHeight) {
      this.renderer.setStyle(this.shimElementRef.nativeElement, 'height', `${scrollHeight}px`);
      this.lastScrollHeight = scrollHeight;
    }

    return {
      itemCount: itemCount,
      viewWidth: viewWidth,
      viewHeight: viewHeight,
      childWidth: childWidth,
      childHeight: childHeight,
      currentChildHeight: contentDimensions ? contentDimensions.height : childHeight,
      itemsPerRow: itemsPerRow,
      itemsPerCol: itemsPerCol,
      itemsPerRowByCalc: itemsPerRowByCalc,
      scrollHeight: scrollHeight
    };
  }

  private calculateItems(forceViewportUpdate: boolean = false) {
    if (!this.doNotCheckAngularZone) {
      NgZone.assertNotInAngularZone();
    }
    let el = this.getElement();

    let d = this.calculateDimensions();
    let items = this.items || [];
    let offsetTop = this.getElementsOffset();
    let elScrollTop = el.scrollTop;

    if (elScrollTop > d.scrollHeight) {
      elScrollTop = d.scrollHeight + offsetTop;
    }

    let scrollTop = Math.max(0, elScrollTop - offsetTop);
    let content = this.contentElementRef.nativeElement;

    if (this.containerElementRef && this.containerElementRef.nativeElement) {
      content = this.containerElementRef.nativeElement;
    }

    let indexByScrollTop = this.previousStart / d.itemsPerRow;
    let childrenContent = content.children;
    if (this.topPadding > scrollTop) {
      // scroll up
      indexByScrollTop -= (this.topPadding - scrollTop) / d.childHeight;
    } else {
      // scroll down
      let topPaddingCurrent = this.topPadding;
      for (let child of childrenContent) {
        let childHeight = child.getBoundingClientRect().height;
        topPaddingCurrent += childHeight;
        if (topPaddingCurrent > scrollTop) {
          indexByScrollTop += 1 - (topPaddingCurrent - scrollTop) / childHeight;
          break;
        } else {
          indexByScrollTop++;
        }
      }

      if (scrollTop > topPaddingCurrent) {
        indexByScrollTop += (scrollTop - topPaddingCurrent) / d.childHeight;
      }
    }

    let end = Math.min(d.itemCount, Math.ceil(indexByScrollTop) * d.itemsPerRow + d.itemsPerRow * (d.itemsPerCol + 1));
    let maxStartEnd = end;

    const modEnd = end % d.itemsPerRow;
    if (modEnd) {
      maxStartEnd = end + d.itemsPerRow - modEnd;
    }
    let maxStart = Math.max(0, maxStartEnd - d.itemsPerCol * d.itemsPerRow - d.itemsPerRow);
    let start = Math.min(maxStart, Math.floor(indexByScrollTop) * d.itemsPerRow);

    start = !isNaN(start) ? start : -1;
    end = !isNaN(end) ? end : -1;
    start -= this.bufferAmount;
    start = Math.max(0, start);
    end += this.bufferAmount;
    end = Math.min(items.length, end);

    if (start === 0) {
      this.topPadding = 0;
      this.previousStart = 0;
    } else {
      if (this.previousChildHeight && this.previousScrollNumberElements && childrenContent[this.previousScrollNumberElements - d.itemsPerRow]) {

        this.topPadding -= childrenContent[this.previousScrollNumberElements - d.itemsPerRow].getBoundingClientRect().bottom - childrenContent[0].getBoundingClientRect().top - this.previousChildHeight;
        this.previousChildHeight = 0;
        this.previousScrollNumberElements = 0;
      }

      if (start < this.previousStart) {
        this.previousChildHeight = 0;
        let maxHeightInRow = 0;

        for (let i = start; i < this.previousStart; i++) {
          maxHeightInRow = Math.max(maxHeightInRow, this.itemsHeight[i] ? this.itemsHeight[i] : d.childHeight);
          if (!((i + 1) % d.itemsPerRow)) {
            this.previousChildHeight += maxHeightInRow * d.itemsPerRow;
            maxHeightInRow = 0;
          }
        }

        this.previousChildHeight /= d.itemsPerRow;
        this.topPadding -= this.previousChildHeight;

        this.previousScrollNumberElements = this.previousStart - start;
      } else {
        this.topPadding += (d.currentChildHeight) * (start - this.previousStart) / d.itemsPerRow;

      }
      this.topPadding = Math.round(this.topPadding);
    }

    if (this.topPadding !== this.lastTopPadding) {
      this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', `translateY(${this.topPadding}px)`);
      this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', `translateY(${this.topPadding}px)`);
      this.lastTopPadding = this.topPadding;
    }
    if (start !== this.previousStart || end !== this.previousEnd || forceViewportUpdate === true) {
      this.zone.run(() => {

        // update the scroll list
        let _end = end >= 0 ? end : 0; // To prevent from accidentally selecting the entire array with a negative 1 (-1) in the end position.
        this.viewPortItems = items.slice(start, _end);
        this.update.emit(this.viewPortItems);

        // emit 'start' event
        if (start !== this.previousStart && this.startupLoop === false) {
          this.start.emit({start, end});
        }

        // emit 'end' event
        if (end !== this.previousEnd && this.startupLoop === false) {
          this.end.emit({start, end});
        }

        if (this.startupLoop === true || (this.previousChildHeight && this.previousScrollNumberElements)) {
          this.refresh();
        } else {
          this.change.emit({start, end});
        }
        
        this.previousStart = start;
        this.previousEnd = end;
      });

    } else if (this.startupLoop === true) {
      this.startupLoop = false;
      this.refresh();
    }
  }
}

@NgModule({
  exports: [VirtualScrollComponent],
  declarations: [VirtualScrollComponent]
})
export class VirtualScrollModule {
}
