"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var common_1 = require('@angular/common');
var VirtualScrollComponent = (function () {
    function VirtualScrollComponent(element, renderer) {
        this.element = element;
        this.renderer = renderer;
        this.items = [];
        this.scrollbarWidth = 10;
        this.scrollbarHeight = 0;
        this.update = new core_1.EventEmitter();
        this.indexUpdate = new core_1.EventEmitter();
        this.startupLoop = true;
        this.onScrollListener = this.renderer.listen(this.element.nativeElement, 'scroll', this.refresh.bind(this));
    }
    VirtualScrollComponent.prototype.ngOnChanges = function () {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        this.refresh();
    };
    VirtualScrollComponent.prototype.ngOnDestroy = function () {
        this.onScrollListener();
    };
    VirtualScrollComponent.prototype.refresh = function () {
        requestAnimationFrame(this.calculateItems.bind(this));
    };
    VirtualScrollComponent.prototype.scrollInto = function (item) {
        var index = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length)
            return;
        var el = this.element.nativeElement;
        var content = this.contentElementRef.nativeElement;
        var viewWidth = el.clientWidth;
        var viewHeight = el.clientHeight;
        var contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
            width: viewWidth,
            height: viewHeight
        };
        var childWidth = contentDimensions.width;
        var childHeight = contentDimensions.height;
        var itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        var itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        el.scrollTop = Math.floor(index / itemsPerRow) * childHeight - Math.max(0, (itemsPerCol - 1)) * childHeight;
        this.refresh();
    };
    VirtualScrollComponent.prototype.calculateItems = function () {
        var el = this.element.nativeElement;
        var content = this.contentElementRef.nativeElement;
        var scrollTop = el.scrollTop;
        var items = this.items || [];
        var itemCount = items.length;
        var viewWidth = el.clientWidth - this.scrollbarWidth;
        var viewHeight = el.clientHeight - this.scrollbarHeight;
        var contentDimensions;
        if (this.childWidth == undefined || this.childHeight == undefined) {
            contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
                width: viewWidth,
                height: viewHeight
            };
        }
        var childWidth = this.childWidth || contentDimensions.width;
        var childHeight = this.childHeight || contentDimensions.height;
        var itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        var itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        this.scrollHeight = childHeight * itemCount / itemsPerRow;
        var start = Math.floor(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow;
        var end = Math.min(itemCount, Math.ceil(scrollTop / this.scrollHeight * itemCount / itemsPerRow) * itemsPerRow + itemsPerRow * (itemsPerCol + 1));
        ;
        this.topPadding = childHeight * Math.ceil(start / itemsPerRow);
        if (start !== this.previousStart || end !== this.previousEnd) {
            this.update.emit(items.slice(start, end));
            this.indexUpdate.emit({
                start: start,
                end: end
            });
            this.previousStart = start;
            this.previousEnd = end;
            if (this.startupLoop === true) {
                this.refresh();
            }
        }
        else {
            this.startupLoop = false;
        }
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Array)
    ], VirtualScrollComponent.prototype, "items", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Number)
    ], VirtualScrollComponent.prototype, "scrollbarWidth", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Number)
    ], VirtualScrollComponent.prototype, "scrollbarHeight", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Number)
    ], VirtualScrollComponent.prototype, "childWidth", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Number)
    ], VirtualScrollComponent.prototype, "childHeight", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', core_1.EventEmitter)
    ], VirtualScrollComponent.prototype, "update", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', core_1.EventEmitter)
    ], VirtualScrollComponent.prototype, "indexUpdate", void 0);
    __decorate([
        core_1.ViewChild('content', { read: core_1.ElementRef }), 
        __metadata('design:type', core_1.ElementRef)
    ], VirtualScrollComponent.prototype, "contentElementRef", void 0);
    VirtualScrollComponent = __decorate([
        core_1.Component({
            selector: 'virtual-scroll',
            template: "\n        <div class=\"total-padding\" [style.height]=\"scrollHeight + 'px'\"></div>\n        <div class=\"scrollable-content\" #content [style.transform]=\"'translateY(' + topPadding + 'px)'\">\n            <ng-content></ng-content>\n        </div>\n    ",
            styles: ["\n        :host {\n            overflow: hidden;\n            overflow-y: auto;\n            position: relative;\n        }\n        .scrollable-content {\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            position: absolute;\n        }\n        .total-padding {\n            width: 1px;\n            opacity: 0;\n        }\n    "]
        }), 
        __metadata('design:paramtypes', [core_1.ElementRef, core_1.Renderer])
    ], VirtualScrollComponent);
    return VirtualScrollComponent;
}());
exports.VirtualScrollComponent = VirtualScrollComponent;
var VirtualScrollModule = (function () {
    function VirtualScrollModule() {
    }
    VirtualScrollModule.forRoot = function () {
        return {
            ngModule: VirtualScrollModule,
            providers: []
        };
    };
    VirtualScrollModule = __decorate([
        core_1.NgModule({
            imports: [common_1.CommonModule],
            exports: [VirtualScrollComponent],
            declarations: [VirtualScrollComponent]
        }), 
        __metadata('design:paramtypes', [])
    ], VirtualScrollModule);
    return VirtualScrollModule;
}());
exports.VirtualScrollModule = VirtualScrollModule;
//# sourceMappingURL=virtual-scroll.js.map