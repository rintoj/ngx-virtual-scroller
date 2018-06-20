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
        this.scrollAnimationTime = 300;
        this.doNotCheckAngularZone = false;
        this.refreshHandler = function () {
            _this.refresh();
        };
        this.update = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.start = new core_1.EventEmitter();
        this.end = new core_1.EventEmitter();
        this.topPadding = 0;
        this.previousStart = 0;
        this.previousEnd = -1;
        this.previousChildHeight = 0;
        this.previousScrollNumberElements = 0;
        this.startupLoop = true;
        this.itemsHeight = {};
        this.window = window;
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
        this.previousStart = 0;
        this.previousEnd = -1;
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
    VirtualScrollComponent.prototype.scrollInto = function (item, additionalOffset) {
        var _this = this;
        var el = this.getElement();
        var offsetTop = this.getElementsOffset();
        var index = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length)
            return;
        var d = this.calculateDimensions();
        var scrollTop = (Math.floor(index / d.itemsPerRow) * d.childHeight) + offsetTop + (additionalOffset ? additionalOffset : 0);
        var animationRequest;
        if (this.currentTween != undefined)
            this.currentTween.stop();
        // totally disable animate
        if (!this.scrollAnimationTime) {
            el.scrollTop = scrollTop;
            return;
        }
        var scrollObj = { scrollTop: el.scrollTop };
        var currentTween = new tween.Tween(scrollObj)
            .to({ scrollTop: scrollTop }, this.scrollAnimationTime)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate(function (data) {
            if (isNaN(data.scrollTop)) {
                return;
            }
            _this.renderer.setProperty(el, 'scrollTop', data.scrollTop);
            _this.refresh();
        })
            .onStop(function () {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        var animate = function (time) {
            currentTween.update(time);
            if (scrollObj.scrollTop !== scrollTop) {
                _this.zone.runOutsideAngular(function () {
                    animationRequest = requestAnimationFrame(animate);
                });
            }
        };
        animate();
        this.currentTween = currentTween;
    };
    VirtualScrollComponent.prototype.getElement = function () {
        if (this.parentScroll instanceof Window) {
            return document.scrollingElement || document.documentElement;
        }
        return this.parentScroll || this.element.nativeElement;
    };
    VirtualScrollComponent.prototype.addParentEventHandlers = function (parentScroll) {
        var _this = this;
        this.removeParentEventHandlers();
        if (parentScroll) {
            this.zone.runOutsideAngular(function () {
                _this.disposeScrollHandler =
                    _this.renderer.listen(parentScroll, 'scroll', _this.refreshHandler);
                if (parentScroll instanceof Window) {
                    _this.disposeResizeHandler =
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
        var scrollElement = this.getElement();
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            offsetTop += this.containerElementRef.nativeElement.offsetTop;
        }
        if (this.parentScroll) {
            offsetTop += this.element.nativeElement.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top;
            if (!(this.parentScroll instanceof Window)) {
                offsetTop += scrollElement.scrollTop;
            }
        }
        return offsetTop;
    };
    VirtualScrollComponent.prototype.calculateDimensions = function () {
        var el = this.getElement();
        var items = this.items || [];
        var itemCount = items.length;
        var viewWidth = el.clientWidth - this.scrollbarWidth;
        var viewHeight = el.clientHeight - this.scrollbarHeight;
        var sumOfCurrentChildHeight = 0;
        var contentDimensions;
        var content = this.contentElementRef.nativeElement;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            content = this.containerElementRef.nativeElement;
        }
        if (this.childWidth == undefined || this.childHeight == undefined) {
            contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
                width: viewWidth,
                height: viewHeight
            };
        }
        var childWidth = this.childWidth || contentDimensions.width;
        var childHeight = this.childHeight || contentDimensions.height;
        var itemsPerRow = Math.max(1, this.countItemsPerRow());
        var i = this.previousStart;
        var maxHeightInRow = 0;
        for (var _i = 0, _a = content.children; _i < _a.length; _i++) {
            var child = _a[_i];
            this.itemsHeight[i] = child.getBoundingClientRect().height;
            maxHeightInRow = Math.max(maxHeightInRow, this.itemsHeight[i]);
            if (!((i + 1) % itemsPerRow)) {
                sumOfCurrentChildHeight += maxHeightInRow * itemsPerRow;
                maxHeightInRow = 0;
            }
            i++;
        }
        var itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
        var itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        var scrollTop = Math.max(0, el.scrollTop);
        var scrollHeight = Math.ceil((childHeight * (itemCount - this.previousEnd) + sumOfCurrentChildHeight) / itemsPerRow + this.topPadding);
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
            currentChildHeight: contentDimensions ? contentDimensions.height : childHeight,
            itemsPerRow: itemsPerRow,
            itemsPerCol: itemsPerCol,
            itemsPerRowByCalc: itemsPerRowByCalc,
            scrollHeight: scrollHeight
        };
    };
    VirtualScrollComponent.prototype.calculateItems = function (forceViewportUpdate) {
        var _this = this;
        if (forceViewportUpdate === void 0) { forceViewportUpdate = false; }
        if (!this.doNotCheckAngularZone) {
            core_1.NgZone.assertNotInAngularZone();
        }
        var el = this.getElement();
        var d = this.calculateDimensions();
        var items = this.items || [];
        var offsetTop = this.getElementsOffset();
        var elScrollTop = el.scrollTop;
        if (elScrollTop > d.scrollHeight) {
            elScrollTop = d.scrollHeight + offsetTop;
        }
        var scrollTop = Math.max(0, elScrollTop - offsetTop);
        var content = this.contentElementRef.nativeElement;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            content = this.containerElementRef.nativeElement;
        }
        var indexByScrollTop = this.previousStart / d.itemsPerRow;
        var childrenContent = content.children;
        if (this.topPadding > scrollTop) {
            // scroll up
            indexByScrollTop -= (this.topPadding - scrollTop) / d.childHeight;
        }
        else {
            // scroll down
            var topPaddingCurrent = this.topPadding;
            for (var _i = 0, childrenContent_1 = childrenContent; _i < childrenContent_1.length; _i++) {
                var child = childrenContent_1[_i];
                var childHeight = child.getBoundingClientRect().height;
                topPaddingCurrent += childHeight;
                if (topPaddingCurrent > scrollTop) {
                    indexByScrollTop += 1 - (topPaddingCurrent - scrollTop) / childHeight;
                    break;
                }
                else {
                    indexByScrollTop++;
                }
            }
            if (scrollTop > topPaddingCurrent) {
                indexByScrollTop += (scrollTop - topPaddingCurrent) / d.childHeight;
            }
        }
        var end = Math.min(d.itemCount, Math.ceil(indexByScrollTop) * d.itemsPerRow + d.itemsPerRow * (d.itemsPerCol + 1));
        var maxStartEnd = end;
        var modEnd = end % d.itemsPerRow;
        if (modEnd) {
            maxStartEnd = end + d.itemsPerRow - modEnd;
        }
        var maxStart = Math.max(0, maxStartEnd - d.itemsPerCol * d.itemsPerRow - d.itemsPerRow);
        var start = Math.min(maxStart, Math.floor(indexByScrollTop) * d.itemsPerRow);
        start = !isNaN(start) ? start : -1;
        end = !isNaN(end) ? end : -1;
        start -= this.bufferAmount;
        start = Math.max(0, start);
        end += this.bufferAmount;
        end = Math.min(items.length, end);
        if (start === 0) {
            this.topPadding = 0;
            this.previousStart = 0;
        }
        else {
            if (this.previousChildHeight && this.previousScrollNumberElements && childrenContent[this.previousScrollNumberElements - d.itemsPerRow]) {
                this.topPadding -= childrenContent[this.previousScrollNumberElements - d.itemsPerRow].getBoundingClientRect().bottom - childrenContent[0].getBoundingClientRect().top - this.previousChildHeight;
                this.previousChildHeight = 0;
                this.previousScrollNumberElements = 0;
            }
            if (start < this.previousStart) {
                this.previousChildHeight = 0;
                var maxHeightInRow = 0;
                for (var i = start; i < this.previousStart; i++) {
                    maxHeightInRow = Math.max(maxHeightInRow, this.itemsHeight[i] ? this.itemsHeight[i] : d.childHeight);
                    if (!((i + 1) % d.itemsPerRow)) {
                        this.previousChildHeight += maxHeightInRow * d.itemsPerRow;
                        maxHeightInRow = 0;
                    }
                }
                this.previousChildHeight /= d.itemsPerRow;
                this.topPadding -= this.previousChildHeight;
                this.previousScrollNumberElements = this.previousStart - start;
            }
            else {
                this.topPadding += (d.currentChildHeight) * (start - this.previousStart) / d.itemsPerRow;
            }
            this.topPadding = Math.round(this.topPadding);
        }
        if (this.topPadding !== this.lastTopPadding) {
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', "translateY(" + this.topPadding + "px)");
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', "translateY(" + this.topPadding + "px)");
            this.lastTopPadding = this.topPadding;
        }
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
                if (_this.startupLoop === true || (_this.previousChildHeight && _this.previousScrollNumberElements)) {
                    _this.refresh();
                }
                else {
                    _this.change.emit({ start: start, end: end });
                }
                _this.previousStart = start;
                _this.previousEnd = end;
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
                    styles: ["\n    :host {\n      overflow: hidden;\n      position: relative;\n      display: block;\n      -webkit-overflow-scrolling: touch;\n    }\n\n    .scrollable-content {\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      position: absolute;\n    }\n\n    .total-padding {\n      width: 1px;\n      opacity: 0;\n    }\n  "]
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
        'parentScroll': [{ type: core_1.Input },],
        'update': [{ type: core_1.Output },],
        'change': [{ type: core_1.Output },],
        'start': [{ type: core_1.Output },],
        'end': [{ type: core_1.Output },],
        'contentElementRef': [{ type: core_1.ViewChild, args: ['content', { read: core_1.ElementRef },] },],
        'shimElementRef': [{ type: core_1.ViewChild, args: ['shim', { read: core_1.ElementRef },] },],
        'containerElementRef': [{ type: core_1.ContentChild, args: ['container', { read: core_1.ElementRef },] },],
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