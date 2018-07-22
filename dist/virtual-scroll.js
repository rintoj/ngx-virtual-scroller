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
        this.window = window;
        this.enableUnequalChildrenSizes_Experimental = false;
        this.bufferAmount = 0;
        this.scrollAnimationTime = 750;
        this.resizeBypassRefreshTheshold = 5;
        this._checkResizeInterval = 1000;
        this._items = [];
        this.update = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.start = new core_1.EventEmitter();
        this.end = new core_1.EventEmitter();
        this.refreshHandler = function () {
            _this.refresh();
        };
        this.calculatedScrollbarWidth = 0;
        this.calculatedScrollbarHeight = 0;
        this.padding = 0;
        this.previousViewPort = {};
        this.itemsHeight = {};
        this.itemsWidth = {};
        this.cachedPageSize = 0;
        this.previousScrollNumberElements = 0;
        this.horizontal = false;
    }
    Object.defineProperty(VirtualScrollComponent.prototype, "checkResizeInterval", {
        get: function () {
            return this._checkResizeInterval;
        },
        set: function (value) {
            if (this._checkResizeInterval === value) {
                return;
            }
            this._checkResizeInterval = value;
            this.addScrollEventHandlers();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollComponent.prototype, "items", {
        get: function () {
            return this._items;
        },
        set: function (value) {
            if (value === this._items) {
                return;
            }
            this._items = value || [];
            this.refresh_internal(true);
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
    Object.defineProperty(VirtualScrollComponent.prototype, "parentScroll", {
        get: function () {
            return this._parentScroll;
        },
        set: function (value) {
            if (this._parentScroll === value) {
                return;
            }
            this._parentScroll = value;
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
        var indexLengthChanged = this.cachedItemsLength !== this.items.length;
        this.cachedItemsLength = this.items.length;
        var firstRun = !changes.items || !changes.items.previousValue || changes.items.previousValue.length === 0;
        this.refresh_internal(indexLengthChanged || firstRun);
    };
    VirtualScrollComponent.prototype.ngDoCheck = function () {
        if (this.cachedItemsLength !== this.items.length) {
            this.cachedItemsLength = this.items.length;
            this.refresh_internal(true);
        }
    };
    VirtualScrollComponent.prototype.refresh = function () {
        this.refresh_internal(false);
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
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        var scrollElement = this.getScrollElement();
        var offset = this.getElementsOffset();
        var dimensions = this.calculateDimensions();
        var scroll = this.calculatePadding(index, dimensions, false) + offset + additionalOffset;
        if (!alignToBeginning) {
            scroll -= dimensions.wrapGroupsPerPage * dimensions[this._childScrollDim];
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
    VirtualScrollComponent.prototype.checkScrollElementResized = function () {
        var boundingRect = this.getScrollElement().getBoundingClientRect();
        var sizeChanged;
        if (!this.previousScrollBoundingRect) {
            sizeChanged = true;
        }
        else {
            var widthChange = Math.abs(boundingRect.width - this.previousScrollBoundingRect.width);
            var heightChange = Math.abs(boundingRect.height - this.previousScrollBoundingRect.height);
            sizeChanged = widthChange > this.resizeBypassRefreshTheshold || heightChange > this.resizeBypassRefreshTheshold;
        }
        if (sizeChanged) {
            this.previousScrollBoundingRect = boundingRect;
            this.refresh();
        }
    };
    VirtualScrollComponent.prototype.updateDirection = function () {
        if (this.horizontal) {
            this._invisiblePaddingProperty = 'width';
            this._offsetType = 'offsetLeft';
            this._pageOffsetType = 'pageXOffset';
            this._childScrollDim = 'childWidth';
            this._translateDir = 'translateX';
            this._scrollType = 'scrollLeft';
        }
        else {
            this._invisiblePaddingProperty = 'height';
            this._offsetType = 'offsetTop';
            this._pageOffsetType = 'pageYOffset';
            this._childScrollDim = 'childHeight';
            this._translateDir = 'translateY';
            this._scrollType = 'scrollTop';
        }
    };
    VirtualScrollComponent.prototype.refresh_internal = function (itemsArrayModified, maxRunTimes) {
        //note: maxRunTimes is to force it to keep recalculating if the previous iteration caused a re-render (different sliced items in viewport or scrollPosition changed). 
        //The default of 2x max will probably be accurate enough without causing too large a performance bottleneck
        //The code would typically quit out on the 2nd iteration anyways. The main time it'd think more than 2 runs would be necessary would be for vastly different sized child items.
        //Without maxRunTimes, If the user is actively scrolling this code would run indefinitely. However, we want to short-circuit it because there are separate scroll event handlers which call this function & we don't want to do the work 2x.
        var _this = this;
        if (maxRunTimes === void 0) { maxRunTimes = 2; }
        this.zone.runOutsideAngular(function () {
            requestAnimationFrame(function () {
                var viewport = _this.calculateViewport(itemsArrayModified);
                var startChanged = itemsArrayModified || viewport.arrayStartIndex !== _this.previousViewPort.arrayStartIndex;
                var endChanged = itemsArrayModified || viewport.arrayEndIndex !== _this.previousViewPort.arrayEndIndex;
                var scrollLengthChanged = viewport.scrollLength !== _this.previousViewPort.scrollLength;
                var paddingChanged = viewport.padding !== _this.previousViewPort.padding;
                _this.previousViewPort = viewport;
                if (scrollLengthChanged) {
                    _this.renderer.setStyle(_this.invisiblePaddingElementRef.nativeElement, _this._invisiblePaddingProperty, viewport.scrollLength + "px");
                }
                if (paddingChanged) {
                    _this.renderer.setStyle(_this.contentElementRef.nativeElement, 'transform', _this._translateDir + "(" + viewport.padding + "px)");
                    _this.renderer.setStyle(_this.contentElementRef.nativeElement, 'webkitTransform', _this._translateDir + "(" + viewport.padding + "px)");
                }
                var emitIndexChangedEvents = true; // maxReRunTimes === 1 (would need to still run if didn't update if previous iteration had updated)
                if (startChanged || endChanged) {
                    _this.zone.run(function () {
                        // update the scroll list to trigger re-render of components in viewport
                        _this.viewPortItems = viewport.arrayStartIndex >= 0 && viewport.arrayEndIndex >= 0 ? _this.items.slice(viewport.arrayStartIndex, viewport.arrayEndIndex + 1) : [];
                        _this.update.emit(_this.viewPortItems);
                        if (emitIndexChangedEvents) {
                            if (startChanged) {
                                _this.start.emit({ start: viewport.arrayStartIndex, end: viewport.arrayEndIndex });
                            }
                            if (endChanged) {
                                _this.end.emit({ start: viewport.arrayStartIndex, end: viewport.arrayEndIndex });
                            }
                            if (startChanged || endChanged) {
                                _this.change.emit({ start: viewport.arrayStartIndex, end: viewport.arrayEndIndex });
                            }
                        }
                        if (maxRunTimes > 0) {
                            _this.refresh_internal(false, maxRunTimes - 1);
                            return;
                        }
                    });
                }
                else if (maxRunTimes > 0) {
                    if (scrollLengthChanged || paddingChanged) {
                        _this.refresh_internal(false, maxRunTimes - 1);
                    }
                }
            });
        });
    };
    VirtualScrollComponent.prototype.getScrollElement = function () {
        return this.parentScroll instanceof Window ? document.scrollingElement || document.documentElement || document.body : this.parentScroll || this.element.nativeElement;
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
                if (_this._checkResizeInterval > 0) {
                    _this.checkScrollElementResizedTimer = setInterval(function () { _this.checkScrollElementResized(); }, _this._checkResizeInterval);
                }
            }
        });
    };
    VirtualScrollComponent.prototype.removeScrollEventHandlers = function () {
        if (this.checkScrollElementResizedTimer) {
            clearInterval(this.checkScrollElementResizedTimer);
        }
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
    VirtualScrollComponent.prototype.countItemsPerWrapGroup = function () {
        var propertyName = this.horizontal ? 'offsetLeft' : 'offsetTop';
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
    VirtualScrollComponent.prototype.getScrollPosition = function () {
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
        var itemsPerRow = Math.ceil(viewWidth / childWidth);
        var itemsPerCol = Math.ceil(viewHeight / childHeight);
        if (this.enableUnequalChildrenSizes_Experimental) {
            var maxHeightInRow = 0;
            var maxWidthInRow = 0;
            var sumOfCurrentChildHeight = 0;
            var sumOfCurrentChildWidth = 0;
            for (var i = 0; i < content.children.length; ++i) {
                var child = content.children[i];
                var index = this.previousViewPort.arrayStartIndex + i;
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
            //scrollHeight = Math.ceil((childHeight * (itemCount - this.previousViewPort.arrayEndIndex) + sumOfCurrentChildHeight) / itemsPerRow + this.previousViewPort.padding);
            //scrollWidth = Math.ceil((childWidth * (itemCount - this.previousViewPort.arrayEndIndex) + sumOfCurrentChildWidth) / itemsPerCol + this.previousViewPort.padding);
        }
        itemsPerCol = Math.max(itemsPerCol, 1);
        itemsPerRow = Math.max(itemsPerRow, 1);
        var itemsPerWrapGroup = this.countItemsPerWrapGroup();
        var wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
        var itemsPerPage = itemsPerWrapGroup * wrapGroupsPerPage;
        var pageCount_fractional = itemCount / itemsPerPage;
        var numberOfWrapGroups = Math.ceil(itemCount / itemsPerWrapGroup);
        var scrollLength = numberOfWrapGroups * (this.horizontal ? childWidth : childHeight);
        return {
            itemCount: itemCount,
            itemsPerWrapGroup: itemsPerWrapGroup,
            wrapGroupsPerPage: wrapGroupsPerPage,
            itemsPerPage: itemsPerPage,
            pageCount_fractional: pageCount_fractional,
            childWidth: childWidth,
            childHeight: childHeight,
            scrollLength: scrollLength
        };
    };
    VirtualScrollComponent.prototype.calculatePadding = function (arrayStartIndex, dimensions, allowUnequalChildrenSizes_Experimental) {
        if (dimensions.itemCount === 0) {
            return 0;
        }
        //UnequalChildrenSizes_Experimental isn't "pure", because it relies on & modifies previous viewport. It seems risky to call it during scrollInto since the original PR didn't. Once it's "pure" we can re-use it in both places.
        if (!allowUnequalChildrenSizes_Experimental || !this.enableUnequalChildrenSizes_Experimental) {
            var wrapGroups = Math.ceil(arrayStartIndex / dimensions.itemsPerWrapGroup);
            return dimensions[this._childScrollDim] * wrapGroups;
        }
        var offset = this.getElementsOffset();
        if (arrayStartIndex === 0) {
            return 0;
        }
        var newPadding = this.previousViewPort.padding;
        var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        var childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;
        if (!childSizeOverride && this.cachedPageSize && this.previousScrollNumberElements && content.children[this.previousScrollNumberElements - dimensions.itemsPerWrapGroup]) {
            var firstChild = content.children[0].getBoundingClientRect();
            var lastChild = content.children[this.previousScrollNumberElements - dimensions.itemsPerWrapGroup].getBoundingClientRect();
            newPadding -= (this.horizontal ? lastChild.right : lastChild.bottom) - (this.horizontal ? firstChild.left : firstChild.top) - this.cachedPageSize;
            this.cachedPageSize = 0;
            this.previousScrollNumberElements = 0;
        }
        if (arrayStartIndex < this.previousViewPort.arrayStartIndex) {
            this.cachedPageSize = 0;
            var childSizeHash = this.horizontal ? this.itemsWidth : this.itemsHeight;
            var defaultChildSize = dimensions[this._childScrollDim];
            var maxChildSize = 0;
            for (var i = arrayStartIndex; i < this.previousViewPort.arrayStartIndex; ++i) {
                maxChildSize = Math.max(maxChildSize, childSizeHash[i] || defaultChildSize);
                if ((i + 1) % dimensions.itemsPerWrapGroup === 0) {
                    this.cachedPageSize += maxChildSize * dimensions.itemsPerWrapGroup;
                    maxChildSize = 0;
                }
            }
            this.cachedPageSize /= dimensions.itemsPerWrapGroup;
            newPadding -= this.cachedPageSize;
            this.previousScrollNumberElements = this.previousViewPort.arrayStartIndex - arrayStartIndex;
        }
        else {
            newPadding += dimensions[this._childScrollDim] * (arrayStartIndex - this.previousViewPort.arrayStartIndex) / dimensions.itemsPerWrapGroup;
        }
        return Math.round(newPadding) + offset;
    };
    VirtualScrollComponent.prototype.calculatePageInfo = function (scrollPosition, dimensions) {
        var scrollPercentage = scrollPosition / dimensions.scrollLength;
        var startingArrayIndex_fractional = Math.min(Math.max(scrollPercentage * dimensions.pageCount_fractional, 0), dimensions.pageCount_fractional) * dimensions.itemsPerPage;
        var maxStart = dimensions.itemCount - dimensions.itemsPerPage - 1;
        var arrayStartIndex = Math.min(Math.floor(startingArrayIndex_fractional), maxStart);
        arrayStartIndex -= arrayStartIndex % dimensions.itemsPerWrapGroup; // round down to start of wrapGroup
        var arrayEndIndex = Math.ceil(startingArrayIndex_fractional) + dimensions.itemsPerPage - 1;
        arrayEndIndex += (dimensions.itemsPerWrapGroup - (arrayEndIndex + 1) % dimensions.itemsPerWrapGroup); // round up to end of wrapGroup
        var bufferSize = this.bufferAmount * dimensions.itemsPerWrapGroup;
        arrayStartIndex -= bufferSize;
        arrayEndIndex += bufferSize;
        if (isNaN(arrayStartIndex)) {
            arrayStartIndex = -1;
        }
        if (isNaN(arrayEndIndex)) {
            arrayEndIndex = -1;
        }
        return {
            arrayStartIndex: Math.min(Math.max(arrayStartIndex, 0), dimensions.itemCount - 1),
            arrayEndIndex: Math.min(Math.max(arrayEndIndex, 0), dimensions.itemCount - 1)
        };
    };
    VirtualScrollComponent.prototype.calculateViewport = function (forceViewportUpdate) {
        if (forceViewportUpdate === void 0) { forceViewportUpdate = false; }
        var dimensions = this.calculateDimensions();
        var offset = this.getElementsOffset();
        var scrollPosition = this.getScrollPosition();
        if (scrollPosition > dimensions.scrollLength && !(this.parentScroll instanceof Window)) {
            scrollPosition = dimensions.scrollLength;
        }
        else {
            scrollPosition -= offset;
        }
        scrollPosition = Math.max(0, scrollPosition);
        var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        var pageInfo;
        if (this.enableUnequalChildrenSizes_Experimental) {
            var indexByScroll = this.previousViewPort.arrayStartIndex / dimensions.itemsPerWrapGroup;
            if (this.previousViewPort.padding > scrollPosition) {
                // scroll up
                indexByScroll -= (this.previousViewPort.padding - scrollPosition) / dimensions[this._childScrollDim];
            }
            else {
                // scroll down
                var childSizeOverride = this.horizontal ? this.childWidth : this.childHeight;
                var paddingCurrent = this.previousViewPort.padding;
                for (var _i = 0, _a = content.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    var childSize = childSizeOverride;
                    if (!childSize) {
                        var boundingRect = child.getBoundingClientRect();
                        childSize = this.horizontal ? boundingRect.width : boundingRect.height;
                    }
                    paddingCurrent += childSize;
                    if (paddingCurrent > scrollPosition) {
                        indexByScroll += 1 - (paddingCurrent - scrollPosition) / childSize;
                        break;
                    }
                    else {
                        ++indexByScroll;
                    }
                }
                if (scrollPosition > paddingCurrent) {
                    indexByScroll += (scrollPosition - paddingCurrent) / dimensions[this._childScrollDim];
                }
            }
            var newEnd = Math.min(dimensions.itemCount, (Math.ceil(indexByScroll) + dimensions.wrapGroupsPerPage + 1) * dimensions.itemsPerWrapGroup);
            var maxStartEnd = newEnd;
            var modEnd = newEnd % dimensions.itemsPerWrapGroup;
            if (modEnd) {
                maxStartEnd = newEnd + dimensions.itemsPerWrapGroup - modEnd;
            }
            var maxStart = Math.max(0, maxStartEnd - dimensions.wrapGroupsPerPage * dimensions.itemsPerWrapGroup - dimensions.itemsPerWrapGroup);
            var newStart = Math.min(maxStart, Math.floor(indexByScroll) * dimensions.itemsPerWrapGroup);
            newStart = !isNaN(newStart) ? newStart : -1;
            newEnd = !isNaN(newEnd) ? newEnd : -1;
            newStart = Math.max(0, Math.min(dimensions.itemCount - 1, newStart));
            newEnd = Math.max(0, Math.min(dimensions.itemCount - 1, newEnd));
            pageInfo = {
                start: newStart,
                end: newEnd
            };
        }
        else {
            pageInfo = this.calculatePageInfo(scrollPosition, dimensions);
        }
        var newPadding = this.calculatePadding(pageInfo.arrayStartIndex, dimensions, true);
        var newScrollLength = dimensions.scrollLength;
        return {
            arrayStartIndex: pageInfo.arrayStartIndex,
            arrayEndIndex: pageInfo.arrayEndIndex,
            padding: Math.round(newPadding),
            scrollLength: Math.round(newScrollLength)
        };
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
                    styles: ["\n    :host {\n      position: relative;\n\t  display: block;\n      -webkit-overflow-scrolling: touch;\n    }\n\t\n\t:host.horizontal.selfScroll {\n      overflow-y: visible;\n      overflow-x: auto;\n\t}\n\t:host.vertical.selfScroll {\n      overflow-y: auto;\n      overflow-x: visible;\n\t}\n\t\n    .scrollable-content {\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      position: absolute;\n    }\n\t\n\t:host.horizontal {\n\t\twhite-space: nowrap;\n\t}\n\t\n\t:host.horizontal .scrollable-content {\n\t\tdisplay: flex;\n\t}\n\t\n\t:host.horizontal .scrollable-content ::ng-deep > * {\n\t\twhite-space: initial;\n\t}\n\t\n    .total-padding {\n      width: 1px;\n      opacity: 0;\n    }\n    \n    :host.horizontal .total-padding {\n      height: 100%;\n    }\n  "]
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
        'resizeBypassRefreshTheshold': [{ type: core_1.Input },],
        'checkResizeInterval': [{ type: core_1.Input },],
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