import { ElementRef, EventEmitter, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {
    private element;
    items: any[];
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    bufferAmount: number;
    scrollAnimationTime: number;
    private refreshHandler;
    private _parentScroll;
    parentScroll: Element | Window;
    update: EventEmitter<any[]>;
    viewPortItems: any[];
    change: EventEmitter<ChangeEvent>;
    start: EventEmitter<ChangeEvent>;
    end: EventEmitter<ChangeEvent>;
    contentElementRef: ElementRef;
    containerElementRef: ElementRef;
    topPadding: number;
    scrollHeight: number;
    previousStart: number;
    previousEnd: number;
    startupLoop: boolean;
    currentTween: any;
    window: Window;
    constructor(element: ElementRef);
    onScroll(): void;
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: SimpleChanges): void;
    refresh(): void;
    scrollInto(item: any): void;
    private addParentEventHandlers(parentScroll);
    private removeParentEventHandlers(parentScroll);
    private countItemsPerRow();
    private getElementsOffset();
    private calculateDimensions();
    private calculateItems();
}
export declare class VirtualScrollModule {
}
