import { ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import * as tween from '@tweenjs/tween.js';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {
    protected readonly element: ElementRef;
    protected readonly renderer: Renderer2;
    protected readonly zone: NgZone;
    private calculatedScrollbarWidth;
    private calculatedScrollbarHeight;
    enableUnequalChildrenSizes_Experimental: boolean;
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    bufferAmount: number;
    scrollAnimationTime: number;
    protected _items: any[];
    items: any[];
    protected _horizontal: boolean;
    protected _offsetType: any;
    protected _scrollType: any;
    protected _pageOffsetType: any;
    protected _scrollDim: any;
    protected _itemsPerScrollDir: any;
    protected _itemsPerOpScrollDir: any;
    protected _childScrollDim: any;
    protected _translateDir: any;
    horizontal: boolean;
    protected updateDirection(): void;
    protected refreshHandler: () => void;
    protected _parentScroll: Element | Window;
    parentScroll: Element | Window;
    update: EventEmitter<any[]>;
    viewPortItems: any[];
    change: EventEmitter<ChangeEvent>;
    start: EventEmitter<ChangeEvent>;
    end: EventEmitter<ChangeEvent>;
    contentElementRef: ElementRef;
    invisiblePaddingElementRef: ElementRef;
    containerElementRef: ElementRef;
    padding: number;
    previousStart: number;
    previousEnd: number;
    previousPageSize: number;
    previousScrollNumberElements: number;
    startupLoop: boolean;
    currentTween: tween.Tween;
    itemsHeight: {
        [key: number]: number;
    };
    itemsWidth: {
        [key: number]: number;
    };
    itemsLength: number;
    window: Window;
    protected disposeScrollHandler: () => void | undefined;
    protected disposeResizeHandler: () => void | undefined;
    /** Cache of the last scroll to prevent setting CSS when not needed. */
    protected lastScrollHeight: number;
    protected lastScrollWidth: number;
    /** Cache of the last padding to prevent setting CSS when not needed. */
    protected lastPadding: number;
    constructor(element: ElementRef, renderer: Renderer2, zone: NgZone);
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: any): void;
    ngDoCheck(): void;
    refresh(forceViewportUpdate?: boolean): void;
    protected getScrollElement(): HTMLElement;
    scrollInto(item: any, additionalOffset?: number): void;
    protected addScrollEventHandlers(): void;
    protected removeScrollEventHandlers(): void;
    protected getElementsOffset(): number;
    protected countItemsPerRow(): number;
    protected countItemsPerCol(): number;
    protected countItemsPerDirection(propertyName: string): number;
    protected getScrollValue(): number;
    protected calculateDimensions(): {
        itemCount: number;
        childWidth: number;
        childHeight: number;
        itemsPerRow: number;
        itemsPerCol: number;
        scrollHeight: number;
        scrollWidth: number;
    };
    protected calculateItems(forceViewportUpdate?: boolean): void;
}
export declare class VirtualScrollModule {
}
