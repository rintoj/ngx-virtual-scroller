import { ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import * as tween from '@tweenjs/tween.js';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export interface IDimensions {
    itemCount: number;
    itemsPerWrapGroup: number;
    wrapGroupsPerPage: number;
    itemsPerPage: number;
    pageCount_fractional: number;
    childWidth: number;
    childHeight: number;
    scrollLength: number;
}
export interface IPageInfo {
    arrayStartIndex: number;
    arrayEndIndex: number;
}
export interface IViewport extends IPageInfo {
    padding: number;
    scrollLength: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {
    protected readonly element: ElementRef;
    protected readonly renderer: Renderer2;
    protected readonly zone: NgZone;
    viewPortItems: any[];
    window: Window;
    protected _enableUnequalChildrenSizes: boolean;
    enableUnequalChildrenSizes: boolean;
    useMarginInsteadOfTranslate: boolean;
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
    scrollInto(item: any, alignToBeginning?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    scrollToIndex(index: number, alignToBeginning?: boolean, additionalOffset?: number, animationMilliseconds?: number, animationCompletedCallback?: () => void): void;
    constructor(element: ElementRef, renderer: Renderer2, zone: NgZone);
    protected previousScrollBoundingRect: ClientRect;
    protected checkScrollElementResized(): void;
    protected _invisiblePaddingProperty: any;
    protected _offsetType: any;
    protected _scrollType: any;
    protected _pageOffsetType: any;
    protected _childScrollDim: any;
    protected _translateDir: any;
    protected _marginDir: any;
    protected updateDirection(): void;
    protected refreshHandler: () => void;
    protected calculatedScrollbarWidth: number;
    protected calculatedScrollbarHeight: number;
    protected padding: number;
    protected previousViewPort: IViewport;
    protected currentTween: tween.Tween;
    protected cachedItemsLength: number;
    protected disposeScrollHandler: () => void | undefined;
    protected disposeResizeHandler: () => void | undefined;
    protected refresh_internal(itemsArrayModified: boolean, maxRunTimes?: number): void;
    protected getScrollElement(): HTMLElement;
    protected addScrollEventHandlers(): void;
    protected removeScrollEventHandlers(): void;
    protected getElementsOffset(): number;
    protected countItemsPerWrapGroup(): number;
    protected getScrollPosition(): number;
    private minMeasuredChildWidth;
    private minMeasuredChildHeight;
    protected calculateDimensions(): IDimensions;
    protected cachedPageSize: number;
    protected previousScrollNumberElements: number;
    protected calculatePadding(arrayStartIndex: number, dimensions: IDimensions, allowUnequalChildrenSizes_Experimental: boolean): number;
    protected calculatePageInfo(scrollPosition: number, dimensions: IDimensions): IPageInfo;
    protected calculateViewport(forceViewportUpdate?: boolean): IViewport;
}
export declare class VirtualScrollModule {
}
