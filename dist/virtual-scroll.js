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
        this.calculatedScrollbarWidth = 0;
        this.calculatedScrollbarHeight = 0;
        this.enableUnequalChildrenSizes_Experimental = false;
        this.bufferAmount = 0;
        this.scrollAnimationTime = 750;
        this._items = [];
        this.refreshHandler = function () {
            _this.refresh();
        };
        this.update = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.start = new core_1.EventEmitter();
        this.end = new core_1.EventEmitter();
        this.padding = 0;
        this.previousStart = 0;
        this.previousEnd = -1;
        this.startupLoop = true;
        this.itemsHeight = {};
        this.itemsWidth = {};
        this.window = window;
        /** Cache of the last scroll to prevent setting CSS when not needed. */
        this.lastScrollHeight = -1;
        this.lastScrollWidth = -1;
        /** Cache of the last padding to prevent setting CSS when not needed. */
        this.lastPadding = -1;
        this.cachedPageSize = 0;
        this.previousScrollNumberElements = 0;
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
        if (this.horizontal) {
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
        var hadPreviousValue = changes.items && changes.items.previousValue && changes.items.previousValue.length > 0;
        if (!hadPreviousValue) {
            this.startupLoop = true;
            this.itemsLength = this.items.length;
        }
        this.refresh();
    };
    VirtualScrollComponent.prototype.ngDoCheck = function () {
        if (this.itemsLength !== this.items.length) {
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
        return this.parentScroll instanceof Window ? document.scrollingElement || document.documentElement || document.body : this.parentScroll || this.element.nativeElement;
    };
    VirtualScrollComponent.prototype.scrollInto = function (item, alignToTop, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        if (alignToTop === void 0) { alignToTop = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        if (animationMilliseconds === void 0) { animationMilliseconds = undefined; }
        if (animationCompletedCallback === void 0) { animationCompletedCallback = undefined; }
        var index = this.items.indexOf(item);
        if (index === -1) {
            return;
        }
        this.scrollToIndex(index, alignToTop, additionalOffset, animationMilliseconds, animationCompletedCallback);
    };
    VirtualScrollComponent.prototype.scrollToIndex = function (index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        var _this = this;
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        if (animationMilliseconds === void 0) { animationMilliseconds = undefined; }
        if (animationCompletedCallback === void 0) { animationCompletedCallback = undefined; }
        animationCompletedCallback = animationCompletedCallback || (function () { });
        animationMilliseconds = animationMilliseconds || this.scrollAnimationTime;
        var scrollElement = this.getScrollElement();
        var dimensions = this.calculateDimensions();
        var scroll = this.calculatePadding(index, dimensions, false) + additionalOffset;
        if (!alignToBeginning) {
            scroll -= Math.max(0, (dimensions[this._itemsPerScrollDir] - 1)) * dimensions[this._childScrollDim];
        }
        var animationRequest;
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = undefined;
        }
        if (!animationMilliseconds) {
            this.renderer.setProperty(scrollElement, this._scrollType, scroll);
            this.refresh();
            animationCompletedCallback();
            return;
        }
        var tweenConfigObj = { scroll: scrollElement[this._scrollType] };
        var newTween = new tween.Tween(tweenConfigObj)
            .to({ scroll: scroll }, animationMilliseconds)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate(function (data) {
            if (isNaN(data.scroll)) {
                return;
            }
            _this.renderer.setProperty(scrollElement, _this._scrollType, data.scroll);
            _this.refresh();
        })
            .onStop(function () {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        var animate = function (time) {
            if (!newTween.isPlaying()) {
                return;
            }
            newTween.update(time);
            if (tweenConfigObj.scroll === scroll) {
                animationCompletedCallback();
                return;
            }
            _this.zone.runOutsideAngular(function () {
                animationRequest = requestAnimationFrame(animate);
            });
        };
        animate();
        this.currentTween = newTween;
    };
    VirtualScrollComponent.prototype.addScrollEventHandlers = function () {
        var _this = this;
        var scrollElement = this.getScrollElement();
        this.removeScrollEventHandlers();
        this.zone.runOutsideAngular(function () {
            if (_this.parentScroll instanceof Window) {
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
    VirtualScrollComponent.prototype.getElementsOffset = function () {
        var offset = 0;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            offset += this.containerElementRef.nativeElement[this._offsetType];
        }
        if (this.parentScroll) {
            var scrollElement = this.getScrollElement();
            var elementClientRect = this.element.nativeElement.getBoundingClientRect();
            var scrollClientRect = scrollElement.getBoundingClientRect();
            if (this.horizontal) {
                offset += elementClientRect.left - scrollClientRect.left;
            }
            else {
                offset += elementClientRect.top - scrollClientRect.top;
            }
            if (!(this.parentScroll instanceof Window)) {
                offset += scrollElement[this._scrollType];
            }
        }
        return offset;
    };
    VirtualScrollComponent.prototype.countItemsPerRow = function () {
        return this.countItemsPerDirection('offsetTop');
    };
    VirtualScrollComponent.prototype.countItemsPerCol = function () {
        return this.countItemsPerDirection('offsetLeft');
    };
    VirtualScrollComponent.prototype.countItemsPerDirection = function (propertyName) {
        var children = this.contentElementRef.nativeElement.children;
        var childrenLength = children ? children.length : 0;
        if (childrenLength === 0) {
            return 1;
        }
        var firstOffset = children[0][propertyName];
        var result = 1;
        while (result < childrenLength && firstOffset === children[result][propertyName]) {
            ++result;
        }
        return result;
    };
    VirtualScrollComponent.prototype.getScrollValue = function () {
        var windowScrollValue = undefined;
        if (this.parentScroll instanceof Window) {
            windowScrollValue = window[this._pageOffsetType];
        }
        return windowScrollValue || this.getScrollElement()[this._scrollType] || 0;
    };
    VirtualScrollComponent.prototype.calculateDimensions = function () {
        var scrollElement = this.getScrollElement();
        var itemCount = this.items.length;
        this.calculatedScrollbarWidth = Math.max(scrollElement.offsetWidth - scrollElement.clientWidth, this.calculatedScrollbarWidth);
        this.calculatedScrollbarHeight = Math.max(scrollElement.offsetHeight - scrollElement.clientHeight, this.calculatedScrollbarHeight);
        var viewWidth = scrollElement.clientWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth);
        var viewHeight = scrollElement.clientHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight);
        var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        var contentDimensions = { width: viewWidth, height: viewHeight };
        if (!this.childWidth || !this.childHeight) {
            var firstChild = content.children.length > 0 ? content.children[0] : undefined;
            if (firstChild) {
                contentDimensions = firstChild.getBoundingClientRect();
            }
        }
        var childWidth = this.childWidth || contentDimensions.width;
        var childHeight = this.childHeight || contentDimensions.height;
        var itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
        var itemsPerColByCalc = Math.max(1, Math.floor(viewHeight / childHeight));
        var itemsPerRow = !this.horizontal ? this.countItemsPerRow() : itemsPerRowByCalc;
        var itemsPerCol = this.horizontal ? this.countItemsPerCol() : itemsPerColByCalc;
        var scroll = Math.max(0, this.getScrollValue());
        var scrollHeight = childHeight * Math.ceil(itemCount / itemsPerRow);
        var scrollWidth = childWidth * Math.ceil(itemCount / itemsPerCol);
        if (this.enableUnequalChildrenSizes_Experimental) {
            var maxHeightInRow = 0;
            var maxWidthInRow = 0;
            var sumOfCurrentChildHeight = 0;
            var sumOfCurrentChildWidth = 0;
            for (var i = 0; i < content.children.length; ++i) {
                var child = content.children[i];
                var index = this.previousStart + i;
                var clientRect = (!this.childHeight || !this.childWidth) ? child.getBoundingClientRect() : undefined;
                this.itemsHeight[index] = this.childHeight || clientRect.height;
                this.itemsWidth[index] = this.childWidth || clientRect.width;
                maxHeightInRow = Math.max(maxHeightInRow, this.itemsHeight[index]);
                maxWidthInRow = Math.max(maxWidthInRow, this.itemsWidth[index]);
                if ((index + 1) % itemsPerRow === 0) {
                    sumOfCurrentChildHeight += maxHeightInRow * itemsPerRow;
                    maxHeightInRow = 0;
                }
                if ((index + 1) % itemsPerCol === 0) {
                    sumOfCurrentChildWidth += maxWidthInRow * itemsPerCol;
                    maxWidthInRow = 0;
                }
            }
            scrollHeight = Math.ceil((childHeight * (itemCount - this.previousEnd) + sumOfCurrentChildHeight) / itemsPerRow + this.lastPadding);
            scrollWidth = Math.ceil((childWidth * (itemCount - this.previousEnd) + sumOfCurrentChildWidth) / itemsPerCol + this.lastPadding);
        }
        if (this.horizontal) {
            if (itemsPerRow === 1 && Math.floor(scroll / scrollWidth * itemCount) + itemsPerColByCalc >= itemCount) {
                itemsPerCol = itemsPerColByCalc;
            }
            if (scrollWidth !== this.lastScrollWidth) {
                this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, 'width', scrollWidth + "px");
                this.lastScrollWidth = scrollWidth;
            }
        }
        else {
            if (itemsPerCol === 1 && Math.floor(scroll / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
                itemsPerRow = itemsPerRowByCalc;
            }
            if (scrollHeight !== this.lastScrollHeight) {
                this.renderer.setStyle(this.invisiblePaddingElementRef.nativeElement, 'height', scrollHeight + "px");
                this.lastScrollHeight = scrollHeight;
            }
        }
        return {
            itemCount: itemCount,
            childWidth: childWidth,
            childHeight: childHeight,
            itemsPerRow: itemsPerRow,
            itemsPerCol: itemsPerCol,
            scrollHeight: scrollHeight,
            scrollWidth: scrollWidth
        };
    };
    VirtualScrollComponent.prototype.calculatePadding = function (start, dimensions, allowUnequalChildrenSizes_Experimental) {
        var offset = this.getElementsOffset();
        //complex calculation isn't "pure", because it relies on global state & modifies that global state. It seems risky to call it during scrollInto since the original PR didn't. Once it's "pure" we can re-use it in both places.
        if (!allowUnequalChildrenSizes_Experimental || !this.enableUnequalChildrenSizes_Experimental) {
            return this.items.length === 0 ? 0 : (dimensions[this._childScrollDim] * Math.ceil(start / dimensions[this._itemsPerOpScrollDir]) - (dimensions[this._childScrollDim] * Math.min(start, this.bufferAmount)) + offset);
        }
        var newPadding = this.lastPadding;
        if (start === 0) {
            newPadding = 0;
            this.previousStart = 0;
        }
        else {
            var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
            var childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;
            if (!childSizeOverride && this.cachedPageSize && this.previousScrollNumberElements && content.children[this.previousScrollNumberElements - dimensions[this._itemsPerOpScrollDir]]) {
                var firstChild = content.children[0].getBoundingClientRect();
                var lastChild = content.children[this.previousScrollNumberElements - dimensions[this._itemsPerOpScrollDir]].getBoundingClientRect();
                newPadding -= (this.horizontal ? lastChild.right : lastChild.bottom) - (this.horizontal ? firstChild.left : firstChild.top) - this.cachedPageSize;
                this.cachedPageSize = 0;
                this.previousScrollNumberElements = 0;
            }
            if (start < this.previousStart) {
                this.cachedPageSize = 0;
                var childSizeHash = this.horizontal ? this.itemsWidth : this.itemsHeight;
                var defaultChildSize = dimensions[this._childScrollDim];
                var maxChildSize = 0;
                for (var i = start; i < this.previousStart; ++i) {
                    maxChildSize = Math.max(maxChildSize, childSizeHash[i] || defaultChildSize);
                    if ((i + 1) % dimensions[this._itemsPerOpScrollDir] === 0) {
                        this.cachedPageSize += maxChildSize * dimensions[this._itemsPerOpScrollDir];
                        maxChildSize = 0;
                    }
                }
                this.cachedPageSize /= dimensions[this._itemsPerOpScrollDir];
                newPadding -= this.cachedPageSize;
                this.previousScrollNumberElements = this.previousStart - start;
            }
            else {
                newPadding += dimensions[this._childScrollDim] * (start - this.previousStart) / dimensions[this._itemsPerOpScrollDir];
            }
            return Math.round(newPadding) + offset;
        }
    };
    VirtualScrollComponent.prototype.calculateItems = function (forceViewportUpdate) {
        var _this = this;
        if (forceViewportUpdate === void 0) { forceViewportUpdate = false; }
        var dimensions = this.calculateDimensions();
        var offset = this.getElementsOffset();
        var elScroll = this.getScrollValue();
        if (elScroll > dimensions[this._scrollDim] && !(this.parentScroll instanceof Window)) {
            elScroll = dimensions[this._scrollDim];
        }
        else {
            elScroll -= offset;
        }
        var scroll = Math.max(0, elScroll);
        var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        var newStart;
        var newEnd;
        if (this.enableUnequalChildrenSizes_Experimental) {
            var indexByScroll = this.previousStart / dimensions[this._itemsPerOpScrollDir];
            if (this.lastPadding > scroll) {
                // scroll up
                indexByScroll -= (this.lastPadding - scroll) / dimensions[this._childScrollDim];
            }
            else {
                // scroll down
                var childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;
                var paddingCurrent = this.lastPadding;
                for (var _i = 0, _a = content.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    var childSize = childSizeOverride;
                    if (!childSize) {
                        var boundingRect = child.getBoundingClientRect();
                        childSize = this.horizontal ? boundingRect.width : boundingRect.height;
                    }
                    paddingCurrent += childSize;
                    if (paddingCurrent > scroll) {
                        indexByScroll += 1 - (paddingCurrent - scroll) / childSize;
                        break;
                    }
                    else {
                        ++indexByScroll;
                    }
                }
                if (scroll > paddingCurrent) {
                    indexByScroll += (scroll - paddingCurrent) / dimensions[this._childScrollDim];
                }
            }
            newEnd = Math.min(dimensions.itemCount, (Math.ceil(indexByScroll) + dimensions[this._itemsPerScrollDir] + 1) * dimensions[this._itemsPerOpScrollDir]);
            var maxStartEnd = newEnd;
            var modEnd = newEnd % dimensions[this._itemsPerOpScrollDir];
            if (modEnd) {
                maxStartEnd = newEnd + dimensions[this._itemsPerOpScrollDir] - modEnd;
            }
            var maxStart = Math.max(0, maxStartEnd - dimensions[this._itemsPerScrollDir] * dimensions[this._itemsPerOpScrollDir] - dimensions[this._itemsPerOpScrollDir]);
            newStart = Math.min(maxStart, Math.floor(indexByScroll) * dimensions[this._itemsPerOpScrollDir]);
        }
        else {
            var indexByScroll = scroll / dimensions[this._scrollDim] * dimensions.itemCount / ((this.horizontal) ? dimensions.itemsPerCol : dimensions.itemsPerRow);
            newEnd = Math.min(dimensions.itemCount, Math.ceil(indexByScroll) * dimensions[this._itemsPerOpScrollDir] + dimensions[this._itemsPerOpScrollDir] * (dimensions[this._itemsPerScrollDir] + 1));
            var maxStartEnd = newEnd;
            var modEnd = newEnd % dimensions[this._itemsPerOpScrollDir];
            if (modEnd) {
                maxStartEnd = newEnd + dimensions[this._itemsPerOpScrollDir] - modEnd;
            }
            var maxStart = Math.max(0, maxStartEnd - dimensions[this._itemsPerScrollDir] * dimensions[this._itemsPerOpScrollDir] - dimensions[this._itemsPerOpScrollDir]);
            newStart = Math.min(maxStart, Math.floor(indexByScroll) * dimensions[this._itemsPerOpScrollDir]);
        }
        newStart = !isNaN(newStart) ? newStart : -1;
        newEnd = !isNaN(newEnd) ? newEnd : -1;
        newStart -= this.bufferAmount;
        newStart = Math.max(0, newStart);
        newEnd += this.bufferAmount;
        newEnd = Math.min(this.items.length, newEnd);
        var newPadding = this.calculatePadding(newStart, dimensions, true);
        if (newPadding !== this.lastPadding) {
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'transform', this._translateDir + "(" + newPadding + "px)");
            this.renderer.setStyle(this.contentElementRef.nativeElement, 'webkitTransform', this._translateDir + "(" + newPadding + "px)");
            this.lastPadding = newPadding;
        }
        if (newStart !== this.previousStart || newEnd !== this.previousEnd || forceViewportUpdate) {
            this.zone.run(function () {
                // update the scroll list
                var _end = newEnd >= 0 ? newEnd : 0; // To prevent from accidentally selecting the entire array with a negative 1 (-1) in the end position. 
                _this.viewPortItems = _this.items.slice(newStart, _end);
                _this.update.emit(_this.viewPortItems);
                // emit 'start' event
                if (newStart !== _this.previousStart && _this.startupLoop === false) {
                    _this.start.emit({ start: newStart, end: newEnd });
                }
                // emit 'end' event
                if (newEnd !== _this.previousEnd && _this.startupLoop === false) {
                    _this.end.emit({ start: newStart, end: newEnd });
                }
                _this.previousStart = newStart;
                _this.previousEnd = newEnd;
                if (_this.startupLoop) {
                    _this.refresh();
                    return;
                }
                else {
                    _this.change.emit({ start: newStart, end: newEnd });
                }
                if ((_this.cachedPageSize && _this.previousScrollNumberElements)) {
                    _this.refresh();
                }
            });
        }
        else if (this.startupLoop) {
            this.startupLoop = false;
            this.change.emit({ start: newStart, end: newEnd });
            this.refresh();
        }
    };
    VirtualScrollComponent.decorators = [
        { type: core_1.Component, args: [{
                    selector: 'virtual-scroll,[virtualScroll]',
                    exportAs: 'virtualScroll',
                    template: "\n    <div class=\"total-padding\" #invisiblePadding></div>\n    <div class=\"scrollable-content\" #content>\n      <ng-content></ng-content>\n    </div>\n  ",
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
        { type: core_1.ElementRef, },
        { type: core_1.Renderer2, },
        { type: core_1.NgZone, },
    ]; };
    VirtualScrollComponent.propDecorators = {
        'enableUnequalChildrenSizes_Experimental': [{ type: core_1.Input },],
        'scrollbarWidth': [{ type: core_1.Input },],
        'scrollbarHeight': [{ type: core_1.Input },],
        'childWidth': [{ type: core_1.Input },],
        'childHeight': [{ type: core_1.Input },],
        'bufferAmount': [{ type: core_1.Input },],
        'scrollAnimationTime': [{ type: core_1.Input },],
        'items': [{ type: core_1.Input },],
        'horizontal': [{ type: core_1.Input },],
        'parentScroll': [{ type: core_1.Input },],
        'update': [{ type: core_1.Output },],
        'change': [{ type: core_1.Output },],
        'start': [{ type: core_1.Output },],
        'end': [{ type: core_1.Output },],
        'contentElementRef': [{ type: core_1.ViewChild, args: ['content', { read: core_1.ElementRef },] },],
        'invisiblePaddingElementRef': [{ type: core_1.ViewChild, args: ['invisiblePadding', { read: core_1.ElementRef },] },],
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