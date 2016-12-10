import { ElementRef, EventEmitter, ModuleWithProviders, OnChanges, OnDestroy, OnInit, Renderer, SimpleChanges } from '@angular/core';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent implements OnInit, OnDestroy, OnChanges {
    private element;
    private renderer;
    items: any[];
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    update: EventEmitter<any[]>;
    change: EventEmitter<ChangeEvent>;
    protected contentElementRef: ElementRef;
    private onScrollListener;
    private topPadding;
    private scrollHeight;
    private previousStart;
    private previousEnd;
    private startupLoop;
    constructor(element: ElementRef, renderer: Renderer);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    refresh(): void;
    scrollInto(item: any): void;
    private countItemsPerRow();
    private calculateDimensions();
    private calculateItems();
}
export declare class VirtualScrollModule {
    static forRoot(): ModuleWithProviders;
}
