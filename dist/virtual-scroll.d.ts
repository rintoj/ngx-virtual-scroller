import { Renderer, OnDestroy, OnChanges, ElementRef, EventEmitter, ModuleWithProviders } from '@angular/core';
export declare class VirtualScrollComponent implements OnDestroy, OnChanges {
    private element;
    private renderer;
    items: any[];
    marginX: number;
    marginY: number;
    update: EventEmitter<any>;
    private onScrollListener;
    private topPadding;
    private bottomPadding;
    private previousStart;
    private previousEnd;
    constructor(element: ElementRef, renderer: Renderer);
    ngOnChanges(): void;
    ngOnDestroy(): void;
    refresh(): void;
    scrollInto(item: any): void;
    private calculateItems();
}
export declare class VirtualScrollModule {
    static forRoot(): ModuleWithProviders;
}
