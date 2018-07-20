import { ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges } from '@angular/core';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {
    private readonly element;
    private readonly renderer;
    private readonly zone;
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    bufferAmount: number;
    scrollAnimationTime: number;
    doNotCheckAngularZone: boolean;
    private _items;
    items: any[];
    private _horizontal;
    private _offsetType;
    private _scrollType;
    private _pageOffsetType;
    private _scrollDim;
    private _itemsPerScrollDir;
    private _itemsPerOpScrollDir;
    private _childScrollDim;
    private _translateDir;
    horizontal: boolean;
    private updateDirection();
    private refreshHandler;
    private _parentScroll;
    parentScroll: Element | Window;
    update: EventEmitter<any[]>;
    viewPortItems: any[];
    change: EventEmitter<ChangeEvent>;
    start: EventEmitter<ChangeEvent>;
    end: EventEmitter<ChangeEvent>;
    contentElementRef: ElementRef;
    shimElementRef: ElementRef;
    containerElementRef: ElementRef;
    previousStart: number;
    previousEnd: number;
    startupLoop: boolean;
    currentTween: any;
    itemsLength: number;
    window: Window;
    private disposeScrollHandler;
    private disposeResizeHandler;
    /** Cache of the last scroll height to prevent setting CSS when not needed. */
    private lastScrollHeight;
    private lastScrollWidth;
    /** Cache of the last top padding to prevent setting CSS when not needed. */
    private lastPadding;
    constructor(element: ElementRef, renderer: Renderer2, zone: NgZone);
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngDoCheck(): void;
    refresh(forceViewportUpdate?: boolean): void;
    private getScrollElement();
    scrollInto(item: any): void;
    private addScrollEventHandlers();
    private removeScrollEventHandlers();
    private countItemsPerRow();
    private countItemsPerCol();
    private getElementsOffset();
    private getScrollValue();
    private calculateDimensions();
    private calculateItems(forceViewportUpdate?);
}
export declare class VirtualScrollModule {
}
