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
    childHeight: number;

    @Output()
    update: EventEmitter<any[]> = new EventEmitter<any[]>();

    @Output()
    indexUpdate: EventEmitter<IndexUpdateEvent> = new EventEmitter<IndexUpdateEvent>();

    @ViewChild('content', { read: ElementRef })
    protected contentElementRef: ElementRef;

    private scrollbarWidth: number;
    private scrollbarHeight: number;
    private onScrollListener: Function;
    private topPadding: number;
    private scrollHeight: number;
    private previousStart: number;
    private previousEnd: number;
    private startupLoop: boolean = true;

    constructor(private element: ElementRef, private renderer: Renderer) { }

    ngOnInit() {
        this.onScrollListener = this.renderer.listen(this.element.nativeElement, 'scroll', this.refresh.bind(this));
        let el = this.element.nativeElement;
        this.scrollbarWidth = 10; // || el.offsetWidth - el.clientWidth;
        this.scrollbarHeight = 0;// || el.offsetHeight - el.clientHeight;
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
        let el = this.element.nativeElement;
        let content = this.contentElementRef.nativeElement;
        let viewWidth = el.clientWidth;
        let viewHeight = el.clientHeight;
        let contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
            width: viewWidth,
            height: viewHeight
        };
        let childHeight = contentDimensions.height;
        let itemsPerRow = Math.max(1, this.countItemsPerRow());
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));

        el.scrollTop = Math.floor(index / itemsPerRow) * childHeight - Math.max(0, (itemsPerCol - 1)) * childHeight;
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

    private calculateItems() {
        let el = this.element.nativeElement;
        let content = this.contentElementRef.nativeElement;
        let scrollTop = el.scrollTop;

        let items = this.items || [];
        let itemCount = items.length;
        let viewHeight = el.clientHeight - this.scrollbarHeight;

        let contentDimensions;
        if (this.childHeight == undefined) {
            contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
                width: el.clientWidth - this.scrollbarWidth,
                height: viewHeight
            };
        }
        let childHeight = this.childHeight || contentDimensions.height;

        let itemsPerRow = Math.max(1, this.countItemsPerRow());
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        this.scrollHeight = childHeight * itemCount / itemsPerRow;

        let start = Math.floor(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow;
        let end = Math.min(itemCount, Math.ceil(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow +
            itemsPerRow * (itemsPerCol + 1));

        this.topPadding = childHeight * Math.ceil(start / itemsPerRow);
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
