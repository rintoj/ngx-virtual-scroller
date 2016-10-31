import {
    Input,
    Output,
    NgModule,
    Renderer,
    Component,
    OnDestroy,
    OnChanges,
    ElementRef,
    EventEmitter,
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
        <div class="padding-layer" [style.height]="topPadding + 'px'"></div>
        <ng-content></ng-content>
        <div class="padding-layer" [style.height]="bottomPadding + 'px'"></div>
    `
})
export class VirtualScrollComponent implements OnDestroy, OnChanges {

    @Input()
    items: any[] = [];

    @Input()
    marginX: number = 0;

    @Input()
    marginY: number = 0;

    @Output()
    update: EventEmitter<any[]> = new EventEmitter<any[]>();

    @Output()
    indexUpdate: EventEmitter<IndexUpdateEvent> = new EventEmitter<IndexUpdateEvent>();

    private onScrollListener: Function;
    private topPadding: number;
    private bottomPadding: number;
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
        let viewWidth = el.clientWidth;
        let viewHeight = el.clientHeight;
        let childWidth = ((el.children[1] || {}).clientWidth || viewWidth) + (this.marginX * 2);
        let childHeight = ((el.children[1] || {}).clientHeight || viewHeight) + (this.marginY * 2);
        let itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));

        el.scrollTop = Math.floor(index / itemsPerRow) * childHeight - Math.max(0, (itemsPerCol - 1)) * childHeight;
        this.refresh();
    }

    private calculateItems() {
        let el = this.element.nativeElement;
        let scrollTop = el.scrollTop;

        let itemCount = (this.items || []).length;
        let viewWidth = el.clientWidth;
        let viewHeight = el.clientHeight;
        let childWidth = ((el.children[1] || {}).clientWidth || viewWidth) + (this.marginX * 2);
        let childHeight = ((el.children[1] || {}).clientHeight || viewHeight) + (this.marginY * 2);

        let itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        let scrollHeight = childHeight * itemCount / itemsPerRow;

        let start = Math.floor(scrollTop / scrollHeight * itemCount / itemsPerRow) * itemsPerRow;
        let end = Math.min(itemCount, Math.ceil(scrollTop / scrollHeight * itemCount / itemsPerRow) * itemsPerRow + itemsPerRow * (itemsPerCol + 1));

        this.topPadding = childHeight * Math.ceil(start / itemsPerRow);
        this.bottomPadding = childHeight * Math.ceil((itemCount - end) / itemsPerRow);
        if (start !== this.previousStart || end !== this.previousEnd) {
            this.update.emit((this.items || []).slice(start, end));
            this.indexUpdate.emit({
                start: start,
                end: Math.min(itemCount, end)
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