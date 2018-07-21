import { ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import * as tween from '@tweenjs/tween.js';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export interface IDimensions {
    itemCount: number;
    childWidth: number;
    childHeight: number;
    itemsPerRow: number;
    itemsPerCol: number;
    scrollHeight: number;
    scrollWidth: number;
}
export interface CalculateItemsResult {
    start: number;
    end: number;
    scrollPosition: number;
    scrollLength: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {
    protected readonly element: ElementRef;
    protected readonly renderer: Renderer2;
    protected readonly zone: NgZone;
    viewPortItems: any[];
    window: Window;
    enableUnequalChildrenSizes_Experimental: boolean;
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    bufferAmount: number;
    scrollAnimationTime: number;
    resizeBypassRefreshTheshold: number;
    protected checkScrollElementResizedTimer: number;
    protected _checkResizeInterval: number;
    checkResizeInterval: number;
    protected _items: any[];
    items: any[];
    protected _horizontal: boolean;
    horizontal: boolean;
    protected _parentScroll: Element | Window;
    parentScroll: Element | Window;
    update: EventEmitter<any[]>;
    change: EventEmitter<ChangeEvent>;
    start: EventEmitter<ChangeEvent>;
    end: EventEmitter<ChangeEvent>;
    contentElementRef: ElementRef;
    invisiblePaddingElementRef: ElementRef;
    containerElementRef: ElementRef;
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: any): void;
    ngDoCheck(): void;
    refresh(): void;
    scrollInto(item: any, alignToTop?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    scrollToIndex(index: number, alignToBeginning?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    constructor(element: ElementRef, renderer: Renderer2, zone: NgZone);
    protected previousScrollBoundingRect: ClientRect;
    protected checkScrollElementResized(): void;
    protected _invisiblePaddingProperty: any;
    protected _offsetType: any;
    protected _scrollType: any;
    protected _pageOffsetType: any;
    protected _scrollDim: any;
    protected _itemsPerScrollDir: any;
    protected _itemsPerOpScrollDir: any;
    protected _childScrollDim: any;
    protected _translateDir: any;
    protected updateDirection(): void;
    protected refreshHandler: () => void;
    protected calculatedScrollbarWidth: number;
    protected calculatedScrollbarHeight: number;
    protected padding: number;
    protected previousStart: number;
    protected previousEnd: number;
    protected currentTween: tween.Tween;
    protected itemsHeight: {
        [key: number]: number;
    };
    protected itemsWidth: {
        [key: number]: number;
    };
    protected cachedItemsLength: number;
    protected disposeScrollHandler: () => void | undefined;
    protected disposeResizeHandler: () => void | undefined;
    /** Cache of the last scroll to prevent setting CSS when not needed. */
    protected lastScrollLength: number;
    /** Cache of the last padding to prevent setting CSS when not needed. */
    protected lastScrollPosition: number;
    protected refresh_internal(itemsArrayModified: boolean, maxReRunTimes?: number): void;
    protected getScrollElement(): HTMLElement;
    protected addScrollEventHandlers(): void;
    protected removeScrollEventHandlers(): void;
    protected getElementsOffset(): number;
    protected countItemsPerRow(): number;
    protected countItemsPerCol(): number;
    protected countItemsPerDirection(propertyName: string): number;
    protected getScrollValue(): number;
    protected calculateDimensions(): IDimensions;
    protected cachedPageSize: number;
    protected previousScrollNumberElements: number;
    protected calculateScrollPosition(start: number, dimensions: IDimensions, allowUnequalChildrenSizes_Experimental: boolean): number;
    protected calculateItems(forceViewportUpdate?: boolean): CalculateItemsResult;
}
export declare class VirtualScrollModule {
}
