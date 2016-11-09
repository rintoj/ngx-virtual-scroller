import {
    Input,
    Output,
    NgModule,
    Renderer,
    Component,
    OnDestroy,
    OnChanges,
    ViewChild,
    ElementRef,
    EventEmitter,
    ViewContainerRef,
    ModuleWithProviders,
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
export class VirtualScrollComponent implements OnDestroy, OnChanges {

    @Input()
    items: any[] = [];

    @Input()
    scrollbarWidth: number = 10;

    @Input()
    scrollbarHeight: number = 0;

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

    constructor(private element: ElementRef, private renderer: Renderer) {
        this.onScrollListener = this.renderer.listen(this.element.nativeElement, 'scroll', this.refresh.bind(this));
    }

    ngOnChanges() {
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
        let childWidth = contentDimensions.width;
        let childHeight = contentDimensions.height;
        let itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));

        el.scrollTop = Math.floor(index / itemsPerRow) * childHeight - Math.max(0, (itemsPerCol - 1)) * childHeight;
        this.refresh();
    }

    private calculateItems() {
        let el = this.element.nativeElement;
        let content = this.contentElementRef.nativeElement;
        let scrollTop = el.scrollTop;

        let items = this.items || [];
        let itemCount = items.length;
        let viewWidth = el.clientWidth - this.scrollbarWidth;
        let viewHeight = el.clientHeight - this.scrollbarHeight;

        let contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
            width: viewWidth,
            height: viewHeight
        };
        let childWidth = contentDimensions.width;
        let childHeight = contentDimensions.height;

        let itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        this.scrollHeight = childHeight * itemCount / itemsPerRow;

        let start = Math.floor(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow;
        let end = Math.min(itemCount, Math.ceil(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow + itemsPerRow * (itemsPerCol + 1));;

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