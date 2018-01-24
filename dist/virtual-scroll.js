"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var tween = require("@tweenjs/tween.js");
var VirtualScrollComponent = (function () {
    function VirtualScrollComponent(element, renderer, zone) {
        var _this = this;
        this.element = element;
        this.renderer = renderer;
        this.zone = zone;
        this.items = [];
        this.bufferAmount = 0;
        this.scrollAnimationTime = 1500;
        this.refreshHandler = function () {
            _this.refresh();
        };
        this.update = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.start = new core_1.EventEmitter();
        this.end = new core_1.EventEmitter();
        this.startupLoop = true;
        /** Cache of the last scroll height to prevent setting CSS when not needed. */
        this.lastScrollHeight = -1;
        /** Cache of the last top padding to prevent setting CSS when not needed. */
        this.lastTopPadding = -1;
    }
    Object.defineProperty(VirtualScrollComponent.prototype, "parentScroll", {
        get: function () {
            return this._parentScroll;
        },
        set: function (element) {
            if (this._parentScroll === element) {
                return;
            }
            this._parentScroll = element;
            this.addParentEventHandlers(this._parentScroll);
        },
        enumerable: true,
        configurable: true
    });
    VirtualScrollComponent.prototype.ngOnInit = function () {
        this.scrollbarWidth = 0; // this.element.nativeElement.offsetWidth - this.element.nativeElement.clientWidth;
        this.scrollbarHeight = 0; // this.element.nativeElement.offsetHeight - this.element.nativeElement.clientHeight;
        if (!this.parentScroll) {
            this.addParentEventHandlers(this.element.nativeElement);
        }
    };
    VirtualScrollComponent.prototype.ngOnDestroy = function () {
        this.removeParentEventHandlers();
    };
    VirtualScrollComponent.prototype.ngOnChanges = function (changes) {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        var items = changes.items || {};
        if (changes.items != undefined && items.previousValue == undefined || (items.previousValue != undefined && items.previousValue.length === 0)) {
            this.startupLoop = true;
        }
        this.refresh();
    };
    VirtualScrollComponent.prototype.refresh = function () {
        var _this = this;
        this.zone.runOutsideAngular(function () {
            requestAnimationFrame(function () { return _this.calculateItems(); });
        });
    };
    VirtualScrollComponent.prototype.scrollInto = function (item) {
        var _this = this;
        var el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
        var offsetTop = this.getElementsOffset();
        var index = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length)
            return;
        var d = this.calculateDimensions();
        var scrollTop = (Math.floor(index / d.itemsPerRow) * d.childHeight)
            - (d.childHeight * Math.min(index, this.bufferAmount));
        if (this.currentTween != undefined)
            this.currentTween.stop();
        this.currentTween = new tween.Tween({ scrollTop: el.scrollTop })
            .to({ scrollTop: scrollTop }, this.scrollAnimationTime)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate(function (data) {
            _this.renderer.setProperty(el, 'scrollTop', data.scrollTop);
            _this.refresh();
        })
            .start();
        var animate = function (time) {
            _this.currentTween.update(time);
            if (_this.currentTween._object.scrollTop !== scrollTop) {
                _this.zone.runOutsideAngular(function () {
                    requestAnimationFrame(animate);
                });
            }
        };
        animate();
    };
    VirtualScrollComponent.prototype.addParentEventHandlers = function (parentScroll) {
        var _this = this;
        this.removeParentEventHandlers();
        if (parentScroll) {
            this.zone.runOutsideAngular(function () {
                _this.disposeScrollHandler =
                    _this.renderer.listen(parentScroll, 'scroll', _this.refreshHandler);
                if (parentScroll instanceof Window) {
                    _this.disposeScrollHandler =
                        _this.renderer.listen('window', 'resize', _this.refreshHandler);
                }
            });
        }
    };
    VirtualScrollComponent.prototype.removeParentEventHandlers = function () {
        if (this.disposeScrollHandler) {
            this.disposeScrollHandler();
            this.disposeScrollHandler = undefined;
        }
        if (this.disposeResizeHandler) {
            this.disposeResizeHandler();
            this.disposeResizeHandler = undefined;
        }
    };
    VirtualScrollComponent.prototype.countItemsPerRow = function () {
        var offsetTop;
        var itemsPerRow;
        var children = this.contentElementRef.nativeElement.children;
        for (itemsPerRow = 0; itemsPerRow < children.length; itemsPerRow++) {
            if (offsetTop != undefined && offsetTop !== children[itemsPerRow].offsetTop)
                break;
            offsetTop = children[itemsPerRow].offsetTop;
        }
        return itemsPerRow;
    };
    VirtualScrollComponent.prototype.getElementsOffset = function () {
        var offsetTop = 0;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            offsetTop += this.containerElementRef.nativeElement.offsetTop;
        }
        if (this.parentScroll) {
            offsetTop += this.element.nativeElement.offsetTop;
        }
        return offsetTop;
    };
    VirtualScrollComponent.prototype.calculateDimensions = function () {
        var el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
        var items = this.items || [];
        var itemCount = items.length;
        var viewWidth = el.clientWidth - this.scrollbarWidth;
        var viewHeight = el.clientHeight - this.scrollbarHeight;
        var contentDimensions;
        if (this.childWidth == undefined || this.childHeight == undefined) {
            var content = this.contentElementRef.nativeElement;
            if (this.containerElementRef && this.containerElementRef.nativeElement) {
                content = this.containerElementRef.nativeElement;
            }
            contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
                width: viewWidth,
                height: viewHeight
            };
        }
        var childWidth = this.childWidth || contentDimensions.width;
        var childHeight = this.childHeight || contentDimensions.height;
        var itemsPerRow = Math.max(1, this.countItemsPerRow());
        var itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
        var itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        var elScrollTop = this.parentScroll instanceof Window
            ? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
            : el.scrollTop;
        var scrollTop = Math.max(0, elScrollTop);
        var scrollHeight = childHeight * itemCount / itemsPerRow;
        if (itemsPerCol === 1 && Math.floor(scrollTop / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
            itemsPerRow = itemsPerRowByCalc;
        }
        if (scrollHeight !== this.lastScrollHeight) {
            this.renderer.setStyle(this.shimElementRef.nativeElement, 'height', scrollHeight + "px");
            this.lastScrollHeight = scrollHeight;
        }
        return {
            itemCount: itemCount,
            viewWidth: viewWidth,
            viewHeight: viewHeight,
            childWidth: childWidth,
            childHeight: childHeight,
            itemsPerRow: itemsPerRow,
            itemsPerCol: itemsPerCol,
            itemsPerRowByCalc: itemsPerRowByCalc,
            scrollHeight: scrollHeight,
        };
    };
    VirtualScrollComponent.prototype.calculateItems = function () {
        var _this = this;
        core_1.NgZone.assertNotInAngularZone();
        var el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
        var d = this.calculateDimensions();
        var items = this.items || [];
        var offsetTop = this.getElementsOffset();
        var elScrollTop = this.parentScroll instanceof Window
            ? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
            : el.scrollTop;
        if (elScrollTop > d.scrollHeight) {
            elScrollTop = d.scrollHeight + offsetTop;
        }
        var scrollTop = Math.max(0, elScrollTop - offsetTop);
        var indexByScrollTop = scrollTop / d.scrollHeight * d.itemCount / d.itemsPerRow;
        var end = Math.min(d.itemCount, Math.ceil(indexByScrollTop) * d.itemsPerRow + d.itemsPerRow * (d.itemsPerCol + 1));
        var maxStartEnd = end;
        var modEnd = end % d.itemsPerRow;
        if (modEnd) {
            maxStartEnd = end + d.itemsPerRow - modEnd;
        }
        var maxStart = Math.max(0, maxStartEnd - d.itemsPerCol * d.itemsPerRow - d.itemsPerRow);
        var start = Math.min(maxStart, Math.floor(indexByScrollTop) * d.itemsPerRow);
        var topPadding = (items == null || items.length === 0) ? 0 : (d.childHeight * Math.ceil(start / d.itemsPerRow) - (d.childHeight * Math.min(start, this.bufferAmount)));
        if (topPadding !== this.lastTopPadding) {
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', "translateY(" + topPadding + "px)");
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', "translateY(" + topPadding + "px)");
            this.lastTopPadding = topPadding;
        }
        start = !isNaN(start) ? start : -1;
        end = !isNaN(end) ? end : -1;
        start -= this.bufferAmount;
        start = Math.max(0, start);
        end += this.bufferAmount;
        end = Math.min(items.length, end);
        if (start !== this.previousStart || end !== this.previousEnd) {
            this.zone.run(function () {
                // update the scroll list
                _this.viewPortItems = items.slice(start, end);
                _this.update.emit(_this.viewPortItems);
                // emit 'start' event
                if (start !== _this.previousStart && _this.startupLoop === false) {
                    _this.start.emit({ start: start, end: end });
                }
                // emit 'end' event
                if (end !== _this.previousEnd && _this.startupLoop === false) {
                    _this.end.emit({ start: start, end: end });
                }
                _this.previousStart = start;
                _this.previousEnd = end;
                if (_this.startupLoop === true) {
                    _this.refresh();
                }
                else {
                    _this.change.emit({ start: start, end: end });
                }
            });
        }
        else if (this.startupLoop === true) {
            this.startupLoop = false;
            this.refresh();
        }
    };
    VirtualScrollComponent.decorators = [
        { type: core_1.Component, args: [{
                    selector: 'virtual-scroll,[virtualScroll]',
                    exportAs: 'virtualScroll',
                    template: "\n    <div class=\"total-padding\" #shim></div>\n    <div class=\"scrollable-content\" #content>\n      <ng-content></ng-content>\n    </div>\n  ",
                    host: {
                        '[style.overflow-y]': "parentScroll ? 'hidden' : 'auto'"
                    },
                    styles: ["\n    :host {\n      overflow: hidden;\n      position: relative;\n\t  display: block;\n      -webkit-overflow-scrolling: touch;\n    }\n    .scrollable-content {\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      position: absolute;\n    }\n    .total-padding {\n      width: 1px;\n      opacity: 0;\n    }\n  "]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollComponent.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: core_1.Renderer2, },
        { type: core_1.NgZone, },
    ]; };
    VirtualScrollComponent.propDecorators = {
        'items': [{ type: core_1.Input },],
        'scrollbarWidth': [{ type: core_1.Input },],
        'scrollbarHeight': [{ type: core_1.Input },],
        'childWidth': [{ type: core_1.Input },],
        'childHeight': [{ type: core_1.Input },],
        'bufferAmount': [{ type: core_1.Input },],
        'scrollAnimationTime': [{ type: core_1.Input },],
        'parentScroll': [{ type: core_1.Input },],
        'update': [{ type: core_1.Output },],
        'change': [{ type: core_1.Output },],
        'start': [{ type: core_1.Output },],
        'end': [{ type: core_1.Output },],
        'contentElementRef': [{ type: core_1.ViewChild, args: ['content', { read: core_1.ElementRef },] },],
        'shimElementRef': [{ type: core_1.ViewChild, args: ['shim', { read: core_1.ElementRef },] },],
        'containerElementRef': [{ type: core_1.ContentChild, args: ['container',] },],
    };
    return VirtualScrollComponent;
}());
exports.VirtualScrollComponent = VirtualScrollComponent;
var VirtualScrollModule = (function () {
    function VirtualScrollModule() {
    }
    VirtualScrollModule.decorators = [
        { type: core_1.NgModule, args: [{
                    exports: [VirtualScrollComponent],
                    declarations: [VirtualScrollComponent]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollModule.ctorParameters = function () { return []; };
    return VirtualScrollModule;
}());
exports.VirtualScrollModule = VirtualScrollModule;
//# sourceMappingURL=virtual-scroll.js.map