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
    throttleTime: number;
    private refreshHandler;
    _parentScroll: Element | Window;
    parentScroll: Element | Window;
    update: EventEmitter<any[]>;
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
    refreshThrottled: any;
    constructor(element: ElementRef);
    onScroll(): void;
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: SimpleChanges): void;
    refresh(callback?: Function): void;
    scrollInto(item: any, scrollEndCallback?: Function, doRefresh?: boolean): void;
    private addParentEventHandlers(parentScroll);
    private removeParentEventHandlers(parentScroll);
    private countItemsPerRow();
    private getElementsOffset();
    private calculateDimensions();
    private calculateItems();
}
export declare class VirtualScrollModule {
}
