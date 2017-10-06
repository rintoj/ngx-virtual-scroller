import { ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges } from '@angular/core';
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
    refresh(): void;
    scrollInto(item: any): void;
    private addParentEventHandlers(parentScroll);
    private removeParentEventHandlers();
    private countItemsPerRow();
    private getElementsOffset();
    private calculateDimensions();
    private calculateItems();
}
export declare class VirtualScrollModule {
}
