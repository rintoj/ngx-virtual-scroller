import { ElementRef, EventEmitter, OnChanges, OnInit, Renderer, SimpleChanges } from '@angular/core';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges {
    private element;
    private renderer;
    items: any[];
    bufferAmount: number;
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    keepIndexOnChange: boolean;
    update: EventEmitter<any[]>;
    change: EventEmitter<ChangeEvent>;
    start: EventEmitter<ChangeEvent>;
    end: EventEmitter<ChangeEvent>;
    contentElementRef: ElementRef;
    topPadding: number;
    scrollHeight: number;
    previousStart: number;
    previousEnd: number;
    startupLoop: boolean;
    constructor(element: ElementRef, renderer: Renderer);
    onScroll(e: Event): void;
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    refresh(byIndex?: boolean, itemNumDiff?: number, animationFrame?: boolean): void;
    scrollInto(item: any): void;
    private countItemsPerRow();
    private calculateDimensions();
    private calculateItems(byIndex?, itemNumDiff?);
}
export declare class VirtualScrollModule {
}
