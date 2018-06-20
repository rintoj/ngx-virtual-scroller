import { ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import * as tween from '@tweenjs/tween.js';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent implements OnInit, OnChanges, OnDestroy {
    private readonly element;
    private readonly renderer;
    private readonly zone;
    items: any[];
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    bufferAmount: number;
    scrollAnimationTime: number;
    doNotCheckAngularZone: boolean;
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
    topPadding: number;
    previousStart: number;
    previousEnd: number;
    previousChildHeight: number;
    previousScrollNumberElements: number;
    startupLoop: boolean;
    currentTween: tween.Tween;
    itemsHeight: {
        [key: number]: number;
    };
    window: Window;
    private disposeScrollHandler;
    private disposeResizeHandler;
    /** Cache of the last scroll height to prevent setting CSS when not needed. */
    private lastScrollHeight;
    /** Cache of the last top padding to prevent setting CSS when not needed. */
    private lastTopPadding;
    constructor(element: ElementRef, renderer: Renderer2, zone: NgZone);
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: SimpleChanges): void;
    refresh(forceViewportUpdate?: boolean): void;
    scrollInto(item: any, additionalOffset?: number): void;
    private getElement();
    private addParentEventHandlers(parentScroll);
    private removeParentEventHandlers();
    private countItemsPerRow();
    private getElementsOffset();
    private calculateDimensions();
    private calculateItems(forceViewportUpdate?);
}
export declare class VirtualScrollModule {
}
