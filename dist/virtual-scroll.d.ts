import { ElementRef, EventEmitter, OnChanges, OnInit, Renderer, SimpleChanges } from '@angular/core';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges {
    private element;
    private renderer;
    items: any[];
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    bufferAmount: number;
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
    refresh(): void;
    scrollInto(item: any): void;
    private countItemsPerRow();
    private calculateDimensions();
    private calculateItems();
}
export declare class VirtualScrollModule {
}
