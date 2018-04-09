"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
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
        this.doNotCheckAngularZone = false;
        this._horizontal = false;
        this._offsetType = 'offsetTop';
        this._scrollType = 'scrollTop';
        this._pageOffsetType = 'pageYOffset';
        this._scrollDim = 'scrollHeight';
        this._itemsPerScrollDir = 'itemsPerCol';
        this._itemsPerOpScrollDir = 'itemsPerRow';
        this._childScrollDim = 'childHeight';
        this._translateDir = 'translateY';
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
        this.lastScrollWidth = -1;
        /** Cache of the last top padding to prevent setting CSS when not needed. */
        this.lastPadding = -1;
    }
    Object.defineProperty(VirtualScrollComponent.prototype, "horizontal", {
        get: function () {
            return this._horizontal;
        },
        set: function (value) {
            this._horizontal = value;
            if (this._horizontal) {
                this._offsetType = 'offsetLeft';
                this._pageOffsetType = 'pageXOffset';
                this._scrollDim = 'scrollWidth';
                this._itemsPerScrollDir = 'itemsPerRow';
                this._itemsPerOpScrollDir = 'itemsPerCol';
                this._childScrollDim = 'childWidth';
                this._translateDir = 'translateX';
                this._scrollType = 'scrollLeft';
            }
        },
        enumerable: true,
        configurable: true
    });
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
    VirtualScrollComponent.prototype.refresh = function (forceViewportUpdate) {
        var _this = this;
        if (forceViewportUpdate === void 0) { forceViewportUpdate = false; }
        this.zone.runOutsideAngular(function () {
            requestAnimationFrame(function () { return _this.calculateItems(forceViewportUpdate); });
        });
    };
    VirtualScrollComponent.prototype.scrollInto = function (item) {
        var _this = this;
        var el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
        var offset = this.getElementsOffset();
        var index = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length)
            return;
        var d = this.calculateDimensions();
        var scroll = (Math.floor(index / d[this._itemsPerOpScrollDir]) * d[this._childScrollDim])
            - (d[this._childScrollDim] * Math.min(index, this.bufferAmount));
        var animationRequest;
        if (this.currentTween != undefined)
            this.currentTween.stop();
        // totally disable animate
        if (!this.scrollAnimationTime) {
            el[this._scrollType] = scroll;
            return;
        }
        var tweenConfigObj = {};
        tweenConfigObj[this._scrollType] = el[this._scrollType];
        this.currentTween = new tween.Tween(tweenConfigObj)
            .to({ scroll: scroll }, this.scrollAnimationTime)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate(function (data) {
            if (isNaN(data[_this._scrollType])) {
                return;
            }
            _this.renderer.setProperty(el, _this._scrollType, data[_this._scrollType]);
            _this.refresh();
        })
            .onStop(function () {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        var animate = function (time) {
            _this.currentTween.update(time);
            if (_this.currentTween._object[_this._scrollType] !== scroll) {
                _this.zone.runOutsideAngular(function () {
                    animationRequest = requestAnimationFrame(animate);
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
        var offset = 0;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            offset += this.containerElementRef.nativeElement[this._offsetType];
        }
        if (this.parentScroll) {
            offset += this.element.nativeElement[this._offsetType];
        }
        return offset;
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
        var elScroll = this.parentScroll instanceof Window
            ? (window[this._pageOffsetType] || document.documentElement[this._scrollType] || document.body[this._scrollType] || 0)
            : el[this._scrollType];
        var scroll = Math.max(0, elScroll);
        var scrollHeight = childHeight * Math.ceil(itemCount / itemsPerRow);
        var scrollWidth = childWidth * Math.ceil(itemCount / itemsPerCol);
        if (itemsPerCol === 1 && Math.floor(scroll / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
            itemsPerRow = itemsPerRowByCalc;
        }
        if (scrollHeight !== this.lastScrollHeight && !this.horizontal) {
            this.renderer.setStyle(this.shimElementRef.nativeElement, 'height', scrollHeight + "px");
            this.lastScrollHeight = scrollHeight;
        }
        if (scrollWidth !== this.lastScrollWidth && this.horizontal) {
            this.renderer.setStyle(this.shimElementRef.nativeElement, 'width', scrollWidth + "px");
            this.lastScrollWidth = scrollWidth;
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
            scrollWidth: scrollWidth
        };
    };
    VirtualScrollComponent.prototype.calculateItems = function (forceViewportUpdate) {
        var _this = this;
        if (forceViewportUpdate === void 0) { forceViewportUpdate = false; }
        if (!this.doNotCheckAngularZone) {
            core_1.NgZone.assertNotInAngularZone();
        }
        var el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
        var d = this.calculateDimensions();
        var items = this.items || [];
        var offset = this.getElementsOffset();
        var elScroll = (this.parentScroll instanceof Window) ?
            (window[this._pageOffsetType] || document.documentElement[this._scrollType] || document.body[this._scrollType] || 0)
            : el[this._scrollType];
        console.log("elScroll: " + elScroll);
        if (elScroll > d[this._scrollDim]) {
            elScroll = d[this._scrollDim] + offset;
        }
        var scroll = Math.max(0, elScroll - offset);
        var indexByScroll = scroll / d[this._scrollDim] * d.itemCount / ((this._horizontal) ? 1 : d.itemsPerRow);
        var end = Math.min(d.itemCount, Math.ceil(indexByScroll) * d[this._itemsPerOpScrollDir] + d[this._itemsPerOpScrollDir] * (d[this._itemsPerScrollDir] + 1));
        var maxStartEnd = end;
        var modEnd = end % d[this._itemsPerOpScrollDir];
        if (modEnd) {
            maxStartEnd = end + d[this._itemsPerOpScrollDir] - modEnd;
        }
        var maxStart = Math.max(0, maxStartEnd - d[this._itemsPerScrollDir] * d[this._itemsPerOpScrollDir] - d[this._itemsPerOpScrollDir]);
        var start = Math.min(maxStart, Math.floor(indexByScroll) * d[this._itemsPerOpScrollDir]);
        var dirPadding = (items == null || items.length === 0) ? 0 :
            (d[this._childScrollDim] * Math.ceil(start / d[this._itemsPerOpScrollDir]) -
                (d[this._childScrollDim] * Math.min(start, this.bufferAmount)));
        console.log("start : " + start + ", end: " + end + ", dirPadding: " + dirPadding + ", lastPadding, " + this.lastPadding);
        if (dirPadding !== this.lastPadding) {
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', this._translateDir + "(" + dirPadding + "px)");
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', this._translateDir + "(" + dirPadding + "px)");
            this.lastPadding = dirPadding;
        }
        start = !isNaN(start) ? start : -1;
        end = !isNaN(end) ? end : -1;
        start -= this.bufferAmount;
        start = Math.max(0, start);
        end += this.bufferAmount;
        end = Math.min(items.length, end);
        if (start !== this.previousStart || end !== this.previousEnd || forceViewportUpdate === true) {
            this.zone.run(function () {
                // update the scroll list
                var _end = end >= 0 ? end : 0; // To prevent from accidentally selecting the entire array with a negative 1 (-1) in the end position. 
                _this.viewPortItems = items.slice(start, _end);
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
                    template: "\n    <div [ngClass]=\"{'total-padding': true, 'horizontal-padding': this.horizontal }\" #shim></div>\n    <div class=\"scrollable-content\" #content>\n      <ng-content></ng-content>\n    </div>\n  ",
                    host: {
                        '[style.overflow-y]': "parentScroll ? 'hidden' : 'auto'",
                        '[style.overflow-x]': "parentScroll ? 'hidden' : 'auto'"
                    },
                    styles: ["\n    :host {\n      overflow: hidden;\n      position: relative;\n\t  display: block;\n      -webkit-overflow-scrolling: touch;\n    }\n    .scrollable-content {\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      position: absolute;\n    }\n    .total-padding {\n      width: 1px;\n      opacity: 0;\n    }\n    \n    .horizontal-padding {\n      height: 100%;\n    }\n  "]
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
        'doNotCheckAngularZone': [{ type: core_1.Input },],
        'horizontal': [{ type: core_1.Input },],
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
                    declarations: [VirtualScrollComponent],
                    imports: [common_1.CommonModule]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollModule.ctorParameters = function () { return []; };
    return VirtualScrollModule;
}());
exports.VirtualScrollModule = VirtualScrollModule;
//# sourceMappingURL=virtual-scroll.js.map