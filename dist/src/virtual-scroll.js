"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var tween = require("@tweenjs/tween.js");
var VirtualScrollComponent = /** @class */ (function () {
    function VirtualScrollComponent(element, renderer, zone) {
        var _this = this;
        this.element = element;
        this.renderer = renderer;
        this.zone = zone;
        this.bufferAmount = 0;
        this.scrollAnimationTime = 1500;
        this.doNotCheckAngularZone = false;
        this._items = [];
        this.refreshHandler = function () {
            _this.refresh();
        };
        this.update = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.start = new core_1.EventEmitter();
        this.end = new core_1.EventEmitter();
        this.startupLoop = true;
        this.window = window;
        /** Cache of the last scroll height to prevent setting CSS when not needed. */
        this.lastScrollHeight = -1;
        this.lastScrollWidth = -1;
        /** Cache of the last top padding to prevent setting CSS when not needed. */
        this.lastPadding = -1;
        this.horizontal = false;
    }
    Object.defineProperty(VirtualScrollComponent.prototype, "items", {
        get: function () {
            return this._items;
        },
        set: function (items) {
            if (items === this._items) {
                return;
            }
            this._items = items || [];
            this.refresh();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollComponent.prototype, "horizontal", {
        get: function () {
            return this._horizontal;
        },
        set: function (value) {
            this._horizontal = value;
            this.updateDirection();
        },
        enumerable: true,
        configurable: true
    });
    VirtualScrollComponent.prototype.updateDirection = function () {
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
        else {
            this._offsetType = 'offsetTop';
            this._pageOffsetType = 'pageYOffset';
            this._scrollDim = 'scrollHeight';
            this._itemsPerScrollDir = 'itemsPerCol';
            this._itemsPerOpScrollDir = 'itemsPerRow';
            this._childScrollDim = 'childHeight';
            this._translateDir = 'translateY';
            this._scrollType = 'scrollTop';
        }
    };
    Object.defineProperty(VirtualScrollComponent.prototype, "parentScroll", {
        get: function () {
            return this._parentScroll;
        },
        set: function (element) {
            if (this._parentScroll === element) {
                return;
            }
            this._parentScroll = element;
            this.addScrollEventHandlers();
            var scrollElement = this.getScrollElement();
            if (scrollElement !== this.element.nativeElement) {
                scrollElement.style['overflow-y'] = this.horizontal ? 'visible' : 'auto';
                scrollElement.style['overflow-x'] = this.horizontal ? 'auto' : 'visible';
            }
        },
        enumerable: true,
        configurable: true
    });
    VirtualScrollComponent.prototype.ngOnInit = function () {
        this.addScrollEventHandlers();
    };
    VirtualScrollComponent.prototype.ngOnDestroy = function () {
        this.removeScrollEventHandlers();
    };
    VirtualScrollComponent.prototype.ngOnChanges = function (changes) {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        var items = changes.items || {};
        if (changes.items != undefined && items.previousValue == undefined || (items.previousValue != undefined && items.previousValue.length === 0)) {
            this.startupLoop = true;
            this.itemsLength = this.items.length;
        }
        this.refresh();
    };
    VirtualScrollComponent.prototype.ngDoCheck = function () {
        if (this.items && this.itemsLength != this.items.length) {
            this.previousStart = undefined;
            this.previousEnd = undefined;
            this.startupLoop = true;
            this.refresh();
            this.itemsLength = this.items.length;
        }
    };
    VirtualScrollComponent.prototype.refresh = function (forceViewportUpdate) {
        var _this = this;
        if (forceViewportUpdate === void 0) { forceViewportUpdate = false; }
        this.zone.runOutsideAngular(function () {
            requestAnimationFrame(function () { return _this.calculateItems(forceViewportUpdate); });
        });
    };
    VirtualScrollComponent.prototype.getScrollElement = function () {
        return this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element.nativeElement;
    };
    VirtualScrollComponent.prototype.scrollInto = function (item) {
        var _this = this;
        var el = this.getScrollElement();
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
        var tweenScrollTo = {};
        tweenScrollTo[this._scrollType] = scroll;
        this.currentTween = new tween.Tween(tweenConfigObj)
            .to(tweenScrollTo, this.scrollAnimationTime)
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
    VirtualScrollComponent.prototype.addScrollEventHandlers = function () {
        var _this = this;
        var scrollElement = this.getScrollElement();
        this.removeScrollEventHandlers();
        if (!scrollElement) {
            return;
        }
        this.zone.runOutsideAngular(function () {
            if (scrollElement === document.body) {
                _this.disposeScrollHandler = _this.renderer.listen('window', 'scroll', _this.refreshHandler);
                _this.disposeResizeHandler = _this.renderer.listen('window', 'resize', _this.refreshHandler);
            }
            else {
                _this.disposeScrollHandler = _this.renderer.listen(scrollElement, 'scroll', _this.refreshHandler);
            }
        });
    };
    VirtualScrollComponent.prototype.removeScrollEventHandlers = function () {
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
    VirtualScrollComponent.prototype.countItemsPerCol = function () {
        var offsetLeft;
        var itemsPerCol;
        var children = this.contentElementRef.nativeElement.children;
        for (itemsPerCol = 0; itemsPerCol < children.length; itemsPerCol++) {
            if (offsetLeft != undefined && offsetLeft !== children[itemsPerCol].offsetLeft)
                break;
            offsetLeft = children[itemsPerCol].offsetLeft;
        }
        return itemsPerCol;
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
    VirtualScrollComponent.prototype.getScrollValue = function () {
        if (this.parentScroll instanceof Window) {
            return window[this._pageOffsetType] || document.documentElement[this._scrollType] || document.body[this._scrollType] || 0;
        }
        return this.getScrollElement()[this._scrollType];
    };
    VirtualScrollComponent.prototype.calculateDimensions = function () {
        var el = this.getScrollElement();
        var items = this.items || [];
        var itemCount = items.length;
        if (!this.scrollbarWidth) {
            this.scrollbarWidth = el.offsetWidth - el.clientWidth;
        }
        if (!this.scrollbarHeight) {
            this.scrollbarHeight = el.offsetHeight - el.clientHeight;
        }
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
        var itemsPerCol = -1;
        var itemsPerColByCalc = -1;
        var itemsPerRow = -1;
        var itemsPerRowByCalc = -1;
        if (this.horizontal) {
            itemsPerCol = Math.max(1, this.countItemsPerCol());
            itemsPerColByCalc = Math.max(1, Math.floor(viewHeight / childHeight));
            itemsPerRow = Math.max(1, Math.floor(viewWidth / childWidth));
        }
        else {
            itemsPerRow = Math.max(1, this.countItemsPerRow());
            itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
            itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        }
        var elScroll = this.getScrollValue();
        var scroll = Math.max(0, elScroll);
        var scrollHeight = childHeight * Math.ceil(itemCount / itemsPerRow);
        var scrollWidth = childWidth * Math.ceil(itemCount / itemsPerCol);
        if (!this.horizontal && itemsPerCol === 1 && Math.floor(scroll / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
            itemsPerRow = itemsPerRowByCalc;
        }
        // only re-assign in case of horizontal to prevent
        if (this.horizontal && itemsPerRow === 1 && Math.floor(scroll / scrollWidth * itemCount) + itemsPerColByCalc >= itemCount) {
            itemsPerCol = itemsPerColByCalc;
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
            itemsPerColByCalc: itemsPerColByCalc,
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
        var el = this.getScrollElement();
        var d = this.calculateDimensions();
        var items = this.items || [];
        var offset = this.getElementsOffset();
        var elScroll = this.getScrollValue();
        if (elScroll > d[this._scrollDim] && !(this.parentScroll instanceof Window)) {
            elScroll = d[this._scrollDim] + offset;
        }
        var scroll = Math.max(0, elScroll - offset);
        var indexByScroll = scroll / d[this._scrollDim] * d.itemCount / ((this.horizontal) ? d.itemsPerCol : d.itemsPerRow);
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
            this.change.emit({ start: start, end: end });
            this.refresh();
        }
    };
    VirtualScrollComponent.decorators = [
        { type: core_1.Component, args: [{
                    selector: 'virtual-scroll,[virtualScroll]',
                    exportAs: 'virtualScroll',
                    template: "\n    <div class=\"total-padding\" #shim></div>\n    <div class=\"scrollable-content\" #content>\n      <ng-content></ng-content>\n    </div>\n  ",
                    host: {
                        '[class.horizontal]': "horizontal",
                        '[class.vertical]': "!horizontal",
                        '[class.selfScroll]': "!parentScroll"
                    },
                    styles: ["\n    :host {\n      position: relative;\n\t  display: block;\n      -webkit-overflow-scrolling: touch;\n    }\n\t\n\t:host.horizontal.selfScroll {\n      overflow-y: visible;\n      overflow-x: auto;\n\t}\n\t:host.vertical.selfScroll {\n      overflow-y: auto;\n      overflow-x: visible;\n\t}\n\t\n    .scrollable-content {\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      position: absolute;\n    }\n\t\n\t:host.horizontal {\n\t\twhite-space: nowrap;\n\t}\n\t\n\t:host.horizontal .scrollable-content ::ng-deep > * {\n\t\twhite-space: initial;\n\t}\n\t\n    .total-padding {\n      width: 1px;\n      opacity: 0;\n    }\n    \n    :host.horizontal .total-padding {\n      height: 100%;\n    }\n  "]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollComponent.ctorParameters = function () { return [
        { type: core_1.ElementRef },
        { type: core_1.Renderer2 },
        { type: core_1.NgZone }
    ]; };
    VirtualScrollComponent.propDecorators = {
        scrollbarWidth: [{ type: core_1.Input }],
        scrollbarHeight: [{ type: core_1.Input }],
        childWidth: [{ type: core_1.Input }],
        childHeight: [{ type: core_1.Input }],
        bufferAmount: [{ type: core_1.Input }],
        scrollAnimationTime: [{ type: core_1.Input }],
        doNotCheckAngularZone: [{ type: core_1.Input }],
        items: [{ type: core_1.Input }],
        horizontal: [{ type: core_1.Input }],
        parentScroll: [{ type: core_1.Input }],
        update: [{ type: core_1.Output }],
        change: [{ type: core_1.Output }],
        start: [{ type: core_1.Output }],
        end: [{ type: core_1.Output }],
        contentElementRef: [{ type: core_1.ViewChild, args: ['content', { read: core_1.ElementRef },] }],
        shimElementRef: [{ type: core_1.ViewChild, args: ['shim', { read: core_1.ElementRef },] }],
        containerElementRef: [{ type: core_1.ContentChild, args: ['container',] }]
    };
    return VirtualScrollComponent;
}());
exports.VirtualScrollComponent = VirtualScrollComponent;
var VirtualScrollModule = /** @class */ (function () {
    function VirtualScrollModule() {
    }
    VirtualScrollModule.decorators = [
        { type: core_1.NgModule, args: [{
                    exports: [VirtualScrollComponent],
                    declarations: [VirtualScrollComponent],
                    imports: [common_1.CommonModule]
                },] },
    ];
    return VirtualScrollModule;
}());
exports.VirtualScrollModule = VirtualScrollModule;
//# sourceMappingURL=virtual-scroll.js.map