import {
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgModule,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import * as $ from 'jquery';
var throttle = require('lodash.throttle');
export interface ChangeEvent {
  start?: number;
  end?: number;
}

const SCROLL_INTO_ANIM_DURATION = 400;

@Component({
  selector: 'virtual-scroll,[virtualScroll]',
  exportAs: 'virtualScroll',
  template: `
    <div class="total-padding" [style.height]="scrollHeight + 'px'"></div>
    <div class="scrollable-content" #content [style.transform]="'translateY(' + topPadding + 'px)'"
     [style.webkitTransform]="'translateY(' + topPadding + 'px)'">
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
  throttleTime: number = 170;

  private refreshHandler = () => {
    this.refresh();
  };
  _parentScroll: Element | Window;
  @Input()
  set parentScroll(element: Element | Window) {
    if (this._parentScroll === element) {
      return;
    }
    this.removeParentEventHandlers(this._parentScroll);
    this._parentScroll = element;
    this.addParentEventHandlers(this._parentScroll);
  }

  get parentScroll(): Element | Window {
    return this._parentScroll;
  }

  @Output()
  update: EventEmitter<any[]> = new EventEmitter<any[]>();

  @Output()
  change: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

  @Output()
  start: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

  @Output()
  end: EventEmitter<ChangeEvent> = new EventEmitter<ChangeEvent>();

  @ViewChild('content', { read: ElementRef })
  contentElementRef: ElementRef;

  @ContentChild('container')
  containerElementRef: ElementRef;

  topPadding: number;
  scrollHeight: number;
  previousStart: number;
  previousEnd: number;
  startupLoop: boolean = true;
  refreshThrottled = null;

  constructor(private element: ElementRef) {
    this.refreshThrottled = throttle(this.refresh, this.throttleTime, {trailing:true});
  }

  @HostListener('scroll')
  onScroll() {
    this.refreshThrottled();
  }

  ngOnInit() {
    this.scrollbarWidth = 0; // this.element.nativeElement.offsetWidth - this.element.nativeElement.clientWidth;
    this.scrollbarHeight = 0; // this.element.nativeElement.offsetHeight - this.element.nativeElement.clientHeight;
  }

  ngOnDestroy() {
    this.removeParentEventHandlers(this.parentScroll);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.previousStart = undefined;
    this.previousEnd = undefined;
    const items = (changes as any).items || {};
    if ((changes as any).items != undefined && items.previousValue == undefined || (items.previousValue != undefined && items.previousValue.length === 0)) {
      this.startupLoop = true;
    }
    this.refresh();
  }

  refresh(callback: Function = undefined) {
    requestAnimationFrame(() => {
      this.calculateItems();
      if (callback) {
        callback();
      }
    });
  }

  scrollInto(item: any, scrollEndCallback: Function = undefined, doRefresh: boolean = true) {
    let el: Element = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
    let $el = $(el);
    let index: number = (this.items || []).indexOf(item);
    if (index < 0 || index >= (this.items || []).length) return;

    let d = this.calculateDimensions();
    if (index >= this.previousStart && index <= this.previousEnd) {
      //can accurately scroll to a rendered item using its offsetTop
      var itemElem = document.getElementById(item.id);
      if (doRefresh) {
        let scrollTop = this.topPadding + itemElem.offsetTop;
        $el.animate({ scrollTop: scrollTop }, SCROLL_INTO_ANIM_DURATION, () => {
          this.scrollInto(item, scrollEndCallback, false);
        });
      }
      else {
        $el.scrollTop(this.topPadding + itemElem.offsetTop);
        if (scrollEndCallback) {
          setTimeout(scrollEndCallback, 0);
        }
      }
    } else {
      let scrollTop = (Math.floor(index / d.itemsPerRow) * d.childHeight)
        //- (d.childHeight * Math.min(index, this.bufferAmount));
      $el.animate({ scrollTop: scrollTop }, SCROLL_INTO_ANIM_DURATION, () => {
        this.scrollInto(item, scrollEndCallback, false);
      });
    }
  }

  private addParentEventHandlers(parentScroll: Element | Window) {
    if (parentScroll) {
      parentScroll.addEventListener('scroll', this.refreshHandler);
      if (parentScroll instanceof Window) {
        parentScroll.addEventListener('resize', this.refreshHandler);
      }
    }
  }

  private removeParentEventHandlers(parentScroll: Element | Window) {
    if (parentScroll) {
      parentScroll.removeEventListener('scroll', this.refreshHandler);
      if (parentScroll instanceof Window) {
        parentScroll.removeEventListener('resize', this.refreshHandler);
      }
    }
  }

  private countItemsPerRow() {
    return 1;
    /*let offsetTop;
    let itemsPerRow;
    let children = this.contentElementRef.nativeElement.children;
    for (itemsPerRow = 0; itemsPerRow < children.length; itemsPerRow++) {
      if (offsetTop != undefined && offsetTop !== children[itemsPerRow].offsetTop) break;
      offsetTop = children[itemsPerRow].offsetTop;
    }
    return itemsPerRow;*/
  }

  private getElementsOffset(): number {
    let offsetTop = 0;
    if (this.containerElementRef && this.containerElementRef.nativeElement) {
      offsetTop += this.containerElementRef.nativeElement.offsetTop;
    }
    if (this.parentScroll) {
      offsetTop += this.element.nativeElement.offsetTop;
    }
    return offsetTop;
  }

  private calculateDimensions() {
    let el: Element = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
    let items = this.items || [];
    let itemCount = items.length;
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

    let itemsPerRow = Math.max(1, this.countItemsPerRow());
    let itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
    let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
    let scrollTop = Math.max(0, el.scrollTop);
    if (itemsPerCol === 1 && Math.floor(scrollTop / this.scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
      itemsPerRow = itemsPerRowByCalc;
    }

    return {
      itemCount: itemCount,
      viewWidth: viewWidth,
      viewHeight: viewHeight,
      childWidth: childWidth,
      childHeight: childHeight,
      itemsPerRow: itemsPerRow,
      itemsPerCol: itemsPerCol,
      itemsPerRowByCalc: itemsPerRowByCalc
    };
  }

  private calculateItems() {
    let el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
    let d = this.calculateDimensions();

    // Optimization: do not update start and end indexes until scroll reaches the end of list
    if (this.previousStart !== undefined && this.previousEnd !== undefined) {
      let A = el.scrollTop;
      let B = this.topPadding;
      let C = this.topPadding + ((this.previousEnd - this.previousStart) * d.childHeight);
      let D = el.scrollTop + d.viewHeight;
      let H = d.childHeight * 1;
      if (A - B > H && C - D > H) {
        return;
      }
    }

    let items = this.items || [];
    let offsetTop = this.getElementsOffset();
    this.scrollHeight = d.childHeight * d.itemCount / d.itemsPerRow;
    if (el.scrollTop > this.scrollHeight) {
      el.scrollTop = this.scrollHeight + offsetTop;
    }

    let scrollTop = Math.max(0, el.scrollTop - offsetTop);
    let indexByScrollTop = scrollTop / this.scrollHeight * d.itemCount / d.itemsPerRow;
    let end = Math.min(d.itemCount, Math.ceil(indexByScrollTop) * d.itemsPerRow + d.itemsPerRow * (d.itemsPerCol + 1));

    let maxStartEnd = end;
    const modEnd = end % d.itemsPerRow;
    if (modEnd) {
      maxStartEnd = end + d.itemsPerRow - modEnd;
    }
    let maxStart = Math.max(0, maxStartEnd - d.itemsPerCol * d.itemsPerRow - d.itemsPerRow);
    let start = Math.min(maxStart, Math.floor(indexByScrollTop) * d.itemsPerRow);

    this.topPadding = d.childHeight * Math.ceil(start / d.itemsPerRow) - (d.childHeight * Math.min(start, this.bufferAmount));;

    start = !isNaN(start) ? start : -1;
    end = !isNaN(end) ? end : -1;
    start -= this.bufferAmount;
    start = Math.max(0, start);
    end += this.bufferAmount;
    end = Math.min(items.length, end);
    if (start !== this.previousStart || end !== this.previousEnd) {

      // update the scroll list
      this.update.emit(items.slice(start, end));

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

    } else if (this.startupLoop === true) {
      this.startupLoop = false;
      this.refresh();
    }

    if (end === items.length) {
      var contentHeight = this.contentElementRef.nativeElement.offsetHeight;
      var delta = contentHeight - (d.childHeight * (end - start));
      //console.log('jkdelta', this.topPadding, contentHeight, this.scrollHeight + delta, this.scrollHeight, delta);
      if (delta !== 0) {
        this.scrollHeight += delta;
      }
    }
  }
}

@NgModule({
  exports: [VirtualScrollComponent],
  declarations: [VirtualScrollComponent]
})
export class VirtualScrollModule { }
