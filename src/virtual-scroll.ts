import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    ModuleWithProviders,
    NgModule,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    Renderer,
    SimpleChanges,
    ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';

export interface IndexUpdateEvent {
    start?: number;
    end?: number;
}

@Component({
    selector: 'virtual-scroll',
    template: `
        <div class="total-padding" [style.height]="scrollHeight + 'px'"></div>
        <div class="scrollable-content" #content [style.transform]="'translateY(' + topPadding + 'px)'">
            <ng-content></ng-content>
        </div>
    `,
    styles: [`
        :host {
            overflow: hidden;
            overflow-y: auto;
            position: relative;
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
export class VirtualScrollComponent implements OnInit, OnDestroy, OnChanges {

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

    @Output()
    update: EventEmitter<any[]> = new EventEmitter<any[]>();

    @Output()
    indexUpdate: EventEmitter<IndexUpdateEvent> = new EventEmitter<IndexUpdateEvent>();

    @ViewChild('content', { read: ElementRef })
    protected contentElementRef: ElementRef;

    private onScrollListener: Function;
    private topPadding: number;
    private scrollHeight: number;
    private previousStart: number;
    private previousEnd: number;
    private startupLoop: boolean = true;

    constructor(private element: ElementRef, private renderer: Renderer) { }

    ngOnInit() {
        this.onScrollListener = this.renderer.listen(this.element.nativeElement, 'scroll', this.refresh.bind(this));
        this.scrollbarWidth = 0; // this.element.nativeElement.offsetWidth - this.element.nativeElement.clientWidth;
        this.scrollbarHeight = 0; // this.element.nativeElement.offsetHeight - this.element.nativeElement.clientHeight;
    }

    ngOnChanges(changes: SimpleChanges) {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        this.refresh();
    }

    ngOnDestroy() {
        this.onScrollListener();
    }

    refresh() {
        requestAnimationFrame(this.calculateItems.bind(this));
    }

    scrollInto(item: any) {
        let index: number = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length) return;

        let d = this.calculateDimensions();
        this.element.nativeElement.scrollTop = Math.floor(index / d.itemsPerRow) *
            d.childHeight - Math.max(0, (d.itemsPerCol - 1)) * d.childHeight;
        this.refresh();
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

    private calculateDimensions() {
        let el = this.element.nativeElement;
        let content = this.contentElementRef.nativeElement;

        let items = this.items || [];
        let itemCount = items.length;
        let viewWidth = el.clientWidth - this.scrollbarWidth;
        let viewHeight = el.clientHeight - this.scrollbarHeight;

        let contentDimensions;
        if (this.childWidth == undefined || this.childHeight == undefined) {
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
        if (itemsPerCol === 1 && Math.floor(el.scrollTop / this.scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
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
        let el = this.element.nativeElement;

        let d = this.calculateDimensions();
        let items = this.items || [];
        this.scrollHeight = d.childHeight * d.itemCount / d.itemsPerRow;
        if (this.element.nativeElement.scrollTop > this.scrollHeight) {
            this.element.nativeElement.scrollTop = this.scrollHeight;
        }

        let start = Math.floor(el.scrollTop / this.scrollHeight * d.itemCount / d.itemsPerRow) * d.itemsPerRow;
        let end = Math.min(d.itemCount, Math.ceil(el.scrollTop / this.scrollHeight * d.itemCount / d.itemsPerRow) * d.itemsPerRow +
            d.itemsPerRow * (d.itemsPerCol + 1));

        this.topPadding = d.childHeight * Math.ceil(start / d.itemsPerRow);
        if (start !== this.previousStart || end !== this.previousEnd) {
            this.update.emit(items.slice(start, end));
            this.indexUpdate.emit({
                start: start,
                end: end
            });
            this.previousStart = start;
            this.previousEnd = end;
            if (this.startupLoop === true) {
                this.refresh();
            }
        } else {
            this.startupLoop = false;
        }
    }
}

@NgModule({
    imports: [CommonModule],
    exports: [VirtualScrollComponent],
    declarations: [VirtualScrollComponent]
})
export class VirtualScrollModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: VirtualScrollModule,
            providers: []
        };
    }
}