"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var core_2 = require("@angular/core");
var common_1 = require("@angular/common");
var common_2 = require("@angular/common");
var tween = require("@tweenjs/tween.js");
var VirtualScrollComponent = (function () {
    function VirtualScrollComponent(element, renderer, zone, platformId, scrollThrottlingTime, scrollAnimationTime, scrollbarWidth, scrollbarHeight, checkResizeInterval, resizeBypassRefreshThreshold) {
        this.element = element;
        this.renderer = renderer;
        this.zone = zone;
        this.platformId = platformId;
        this.window = window;
        this._enableUnequalChildrenSizes = false;
        this.useMarginInsteadOfTranslate = false;
        this.ssrViewportWidth = 1920;
        this.ssrViewportHeight = 1080;
        this._bufferAmount = 0;
        this.scrollAnimationTime = 750;
        this.resizeBypassRefreshThreshold = 5;
        this._checkResizeInterval = 1000;
        this._items = [];
        this.compareItems = function (item1, item2) { return item1 === item2; };
        this.update = new core_1.EventEmitter();
        this.vsUpdate = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.vsChange = new core_1.EventEmitter();
        this.start = new core_1.EventEmitter();
        this.vsStart = new core_1.EventEmitter();
        this.end = new core_1.EventEmitter();
        this.vsEnd = new core_1.EventEmitter();
        this.calculatedScrollbarWidth = 0;
        this.calculatedScrollbarHeight = 0;
        this.padding = 0;
        this.previousViewPort = {};
        this.cachedPageSize = 0;
        this.previousScrollNumberElements = 0;
        this.scrollThrottlingTime = typeof (scrollThrottlingTime) === 'number' ? scrollThrottlingTime : 0;
        if (typeof (scrollAnimationTime) === 'number') {
            this.scrollAnimationTime = scrollAnimationTime;
        }
        if (typeof (scrollbarWidth) === 'number') {
            this.scrollbarWidth = scrollbarWidth;
        }
        if (typeof (scrollbarHeight) === 'number') {
            this.scrollbarHeight = scrollbarHeight;
        }
        if (typeof (checkResizeInterval) === 'number') {
            this.checkResizeInterval = checkResizeInterval;
        }
        if (typeof (resizeBypassRefreshThreshold) === 'number') {
            this.resizeBypassRefreshThreshold = resizeBypassRefreshThreshold;
        }
        this.horizontal = false;
        this.resetWrapGroupDimensions();
    }
    Object.defineProperty(VirtualScrollComponent.prototype, "viewPortIndices", {
        get: function () {
            var pageInfo = this.previousViewPort || {};
            return {
                startIndex: pageInfo.startIndex || 0,
                endIndex: pageInfo.endIndex || 0
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollComponent.prototype, "viewPortInfo", {
        get: function () {
            var pageInfo = this.previousViewPort || {};
            return {
                startIndex: pageInfo.startIndex || 0,
                endIndex: pageInfo.endIndex || 0,
                scrollStartPosition: pageInfo.scrollStartPosition || 0,
                scrollEndPosition: pageInfo.scrollEndPosition || 0,
                maxScrollPosition: pageInfo.maxScrollPosition || 0
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollComponent.prototype, "enableUnequalChildrenSizes", {
        get: function () {
            return this._enableUnequalChildrenSizes;
        },
        set: function (value) {
            if (this._enableUnequalChildrenSizes === value) {
                return;
            }
            this._enableUnequalChildrenSizes = value;
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollComponent.prototype, "bufferAmount", {
        get: function () {
            return Math.max(this._bufferAmount, this.enableUnequalChildrenSizes ? 5 : 0);
        },
        set: function (value) {
            this._bufferAmount = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollComponent.prototype, "scrollThrottlingTime", {
        get: function () {
            return this._scrollThrottlingTime;
        },
        set: function (value) {
            var _this = this;
            this._scrollThrottlingTime = value;
            this.refresh_throttled = this.throttleTrailing(function () {
                _this.refresh_internal(false);
            }, this._scrollThrottlingTime);
        },
        enumerable: true,
        configurable: true
    });
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
    VirtualScrollComponent.prototype.revertParentOverscroll = function () {
        var scrollElement = this.getScrollElement();
        if (scrollElement && this.oldParentScrollOverflow) {
            scrollElement.style['overflow-y'] = this.oldParentScrollOverflow.y;
            scrollElement.style['overflow-x'] = this.oldParentScrollOverflow.x;
        }
        this.oldParentScrollOverflow = undefined;
    };
    Object.defineProperty(VirtualScrollComponent.prototype, "parentScroll", {
        get: function () {
            return this._parentScroll;
        },
        set: function (value) {
            if (this._parentScroll === value) {
                return;
            }
            this.revertParentOverscroll();
            this._parentScroll = value;
            this.addScrollEventHandlers();
            var scrollElement = this.getScrollElement();
            if (scrollElement !== this.element.nativeElement) {
                this.oldParentScrollOverflow = { x: scrollElement.style['overflow-x'], y: scrollElement.style['overflow-y'] };
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
        this.revertParentOverscroll();
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
        this.refresh_internal(true);
    };
    VirtualScrollComponent.prototype.invalidateAllCachedMeasurements = function () {
        this.wrapGroupDimensions = {
            maxChildSizePerWrapGroup: [],
            numberOfKnownWrapGroupChildSizes: 0,
            sumOfKnownWrapGroupChildWidths: 0,
            sumOfKnownWrapGroupChildHeights: 0
        };
        this.minMeasuredChildWidth = undefined;
        this.minMeasuredChildHeight = undefined;
        this.refresh_internal(false);
    };
    VirtualScrollComponent.prototype.invalidateCachedMeasurementForItem = function (item) {
        if (this.enableUnequalChildrenSizes) {
            var index = this.items && this.items.indexOf(item);
            if (index >= 0) {
                this.invalidateCachedMeasurementAtIndex(index);
            }
        }
        else {
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        }
        this.refresh_internal(false);
    };
    VirtualScrollComponent.prototype.invalidateCachedMeasurementAtIndex = function (index) {
        if (this.enableUnequalChildrenSizes) {
            var cachedMeasurement = this.wrapGroupDimensions.maxChildSizePerWrapGroup[index];
            if (cachedMeasurement) {
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[index] = undefined;
                --this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= cachedMeasurement.childWidth || 0;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= cachedMeasurement.childHeight || 0;
            }
        }
        else {
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        }
        this.refresh_internal(false);
    };
    VirtualScrollComponent.prototype.scrollInto = function (item, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        if (animationMilliseconds === void 0) { animationMilliseconds = undefined; }
        if (animationCompletedCallback === void 0) { animationCompletedCallback = undefined; }
        var index = this.items.indexOf(item);
        if (index === -1) {
            return;
        }
        this.scrollToIndex(index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback);
    };
    VirtualScrollComponent.prototype.scrollToIndex = function (index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        var _this = this;
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        if (animationMilliseconds === void 0) { animationMilliseconds = undefined; }
        if (animationCompletedCallback === void 0) { animationCompletedCallback = undefined; }
        var maxRetries = 5;
        var retryIfNeeded = function () {
            --maxRetries;
            if (maxRetries <= 0) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            var dimensions = _this.calculateDimensions();
            var desiredStartIndex = Math.min(Math.max(index, 0), dimensions.itemCount - 1);
            if (_this.previousViewPort.startIndex === desiredStartIndex) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            _this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, 0, retryIfNeeded);
        };
        this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, animationMilliseconds, retryIfNeeded);
    };
    VirtualScrollComponent.prototype.scrollToIndex_internal = function (index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        if (animationMilliseconds === void 0) { animationMilliseconds = undefined; }
        if (animationCompletedCallback === void 0) { animationCompletedCallback = undefined; }
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        var dimensions = this.calculateDimensions();
        var scroll = this.calculatePadding(index, dimensions) + additionalOffset;
        if (!alignToBeginning) {
            scroll -= dimensions.wrapGroupsPerPage * dimensions[this._childScrollDim];
        }
        this.scrollToPosition(scroll, animationMilliseconds, animationCompletedCallback);
    };
    VirtualScrollComponent.prototype.scrollToPosition = function (scrollPosition, animationMilliseconds, animationCompletedCallback) {
        var _this = this;
        if (animationMilliseconds === void 0) { animationMilliseconds = undefined; }
        if (animationCompletedCallback === void 0) { animationCompletedCallback = undefined; }
        scrollPosition += this.getElementsOffset();
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        var scrollElement = this.getScrollElement();
        var animationRequest;
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = undefined;
        }
        if (!animationMilliseconds) {
            this.renderer.setProperty(scrollElement, this._scrollType, scrollPosition);
            this.refresh_internal(false, animationCompletedCallback);
            return;
        }
        var tweenConfigObj = { scrollPosition: scrollElement[this._scrollType] };
        var newTween = new tween.Tween(tweenConfigObj)
            .to({ scrollPosition: scrollPosition }, animationMilliseconds)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate(function (data) {
            if (isNaN(data.scrollPosition)) {
                return;
            }
            _this.renderer.setProperty(scrollElement, _this._scrollType, data.scrollPosition);
            _this.refresh_internal(false);
        })
            .onStop(function () {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        var animate = function (time) {
            if (!newTween["isPlaying"]()) {
                return;
            }
            newTween.update(time);
            if (tweenConfigObj.scrollPosition === scrollPosition) {
                _this.refresh_internal(false, animationCompletedCallback);
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
            sizeChanged = widthChange > this.resizeBypassRefreshThreshold || heightChange > this.resizeBypassRefreshThreshold;
        }
        if (sizeChanged) {
            this.previousScrollBoundingRect = boundingRect;
            if (boundingRect.width > 0 && boundingRect.height > 0) {
                this.refresh_internal(false);
            }
        }
    };
    VirtualScrollComponent.prototype.updateDirection = function () {
        if (this.horizontal) {
            this._invisiblePaddingProperty = 'width';
            this._offsetType = 'offsetLeft';
            this._pageOffsetType = 'pageXOffset';
            this._childScrollDim = 'childWidth';
            this._marginDir = 'margin-left';
            this._translateDir = 'translateX';
            this._scrollType = 'scrollLeft';
        }
        else {
            this._invisiblePaddingProperty = 'height';
            this._offsetType = 'offsetTop';
            this._pageOffsetType = 'pageYOffset';
            this._childScrollDim = 'childHeight';
            this._marginDir = 'margin-top';
            this._translateDir = 'translateY';
            this._scrollType = 'scrollTop';
        }
    };
    VirtualScrollComponent.prototype.throttleTrailing = function (func, wait) {
        var timeout = undefined;
        var result = function () {
            var _this = this;
            var _arguments = arguments;
            if (timeout) {
                return;
            }
            if (wait <= 0) {
                func.apply(_this, _arguments);
            }
            else {
                timeout = setTimeout(function () {
                    timeout = undefined;
                    func.apply(_this, _arguments);
                }, wait);
            }
        };
        return result;
    };
    VirtualScrollComponent.prototype.refresh_internal = function (itemsArrayModified, refreshCompletedCallback, maxRunTimes) {
        //note: maxRunTimes is to force it to keep recalculating if the previous iteration caused a re-render (different sliced items in viewport or scrollPosition changed).
        //The default of 2x max will probably be accurate enough without causing too large a performance bottleneck
        //The code would typically quit out on the 2nd iteration anyways. The main time it'd think more than 2 runs would be necessary would be for vastly different sized child items or if this is the 1st time the items array was initialized.
        //Without maxRunTimes, If the user is actively scrolling this code would become an infinite loop until they stopped scrolling. This would be okay, except each scroll event would start an additional infinte loop. We want to short-circuit it to prevent his.
        var _this = this;
        if (refreshCompletedCallback === void 0) { refreshCompletedCallback = undefined; }
        if (maxRunTimes === void 0) { maxRunTimes = 2; }
        this.zone.runOutsideAngular(function () {
            requestAnimationFrame(function () {
                if (itemsArrayModified) {
                    _this.resetWrapGroupDimensions();
                }
                var viewport = _this.calculateViewport();
                var startChanged = itemsArrayModified || viewport.startIndex !== _this.previousViewPort.startIndex;
                var endChanged = itemsArrayModified || viewport.endIndex !== _this.previousViewPort.endIndex;
                var scrollLengthChanged = viewport.scrollLength !== _this.previousViewPort.scrollLength;
                var paddingChanged = viewport.padding !== _this.previousViewPort.padding;
                var scrollPositionChanged = viewport.scrollStartPosition !== _this.previousViewPort.scrollStartPosition || viewport.scrollEndPosition !== _this.previousViewPort.scrollEndPosition || viewport.maxScrollPosition !== _this.previousViewPort.maxScrollPosition;
                _this.previousViewPort = viewport;
                if (scrollLengthChanged) {
                    _this.renderer.setStyle(_this.invisiblePaddingElementRef.nativeElement, _this._invisiblePaddingProperty, viewport.scrollLength + "px");
                }
                if (paddingChanged) {
                    if (_this.useMarginInsteadOfTranslate) {
                        _this.renderer.setStyle(_this.contentElementRef.nativeElement, _this._marginDir, viewport.padding + "px");
                    }
                    else {
                        _this.renderer.setStyle(_this.contentElementRef.nativeElement, 'transform', _this._translateDir + "(" + viewport.padding + "px)");
                        _this.renderer.setStyle(_this.contentElementRef.nativeElement, 'webkitTransform', _this._translateDir + "(" + viewport.padding + "px)");
                    }
                }
                if (startChanged || endChanged || scrollPositionChanged) {
                    _this.zone.run(function () {
                        // update the scroll list to trigger re-render of components in viewport
                        _this.viewPortItems = viewport.startIndexWithBuffer >= 0 && viewport.endIndexWithBuffer >= 0 ? _this.items.slice(viewport.startIndexWithBuffer, viewport.endIndexWithBuffer + 1) : [];
                        _this.update.emit(_this.viewPortItems);
                        _this.vsUpdate.emit(_this.viewPortItems);
                        if (startChanged) {
                            var eventArg = { start: viewport.startIndex, end: viewport.endIndex, scrollStartPosition: viewport.scrollStartPosition, scrollEndPosition: viewport.scrollEndPosition };
                            _this.start.emit(eventArg);
                            _this.vsStart.emit(eventArg);
                        }
                        if (endChanged) {
                            var eventArg = { start: viewport.startIndex, end: viewport.endIndex, scrollStartPosition: viewport.scrollStartPosition, scrollEndPosition: viewport.scrollEndPosition };
                            _this.end.emit(eventArg);
                            _this.vsEnd.emit(eventArg);
                        }
                        if (startChanged || endChanged) {
                            var eventArg = { start: viewport.startIndex, end: viewport.endIndex, scrollStartPosition: viewport.scrollStartPosition, scrollEndPosition: viewport.scrollEndPosition };
                            _this.change.emit(eventArg);
                            _this.vsChange.emit(eventArg);
                        }
                        if (maxRunTimes > 0) {
                            _this.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                            return;
                        }
                        if (refreshCompletedCallback) {
                            refreshCompletedCallback();
                        }
                    });
                }
                else {
                    if (maxRunTimes > 0 && (scrollLengthChanged || paddingChanged)) {
                        _this.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                        return;
                    }
                    if (refreshCompletedCallback) {
                        refreshCompletedCallback();
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
                _this.disposeScrollHandler = _this.renderer.listen('window', 'scroll', _this.refresh_throttled);
                _this.disposeResizeHandler = _this.renderer.listen('window', 'resize', _this.refresh_throttled);
            }
            else {
                _this.disposeScrollHandler = _this.renderer.listen(scrollElement, 'scroll', _this.refresh_throttled);
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
        var children = ((this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement).children;
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
    VirtualScrollComponent.prototype.getScrollStartPosition = function () {
        var windowScrollValue = undefined;
        if (this.parentScroll instanceof Window) {
            windowScrollValue = window[this._pageOffsetType];
        }
        return windowScrollValue || this.getScrollElement()[this._scrollType] || 0;
    };
    VirtualScrollComponent.prototype.resetWrapGroupDimensions = function () {
        var oldWrapGroupDimensions = this.wrapGroupDimensions;
        this.invalidateAllCachedMeasurements();
        if (!this.enableUnequalChildrenSizes || !oldWrapGroupDimensions || oldWrapGroupDimensions.numberOfKnownWrapGroupChildSizes === 0) {
            return;
        }
        var itemsPerWrapGroup = this.countItemsPerWrapGroup();
        for (var wrapGroupIndex = 0; wrapGroupIndex < oldWrapGroupDimensions.maxChildSizePerWrapGroup.length; ++wrapGroupIndex) {
            var oldWrapGroupDimension = oldWrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
            if (!oldWrapGroupDimension || !oldWrapGroupDimension.items || !oldWrapGroupDimension.items.length) {
                continue;
            }
            if (oldWrapGroupDimension.items.length !== itemsPerWrapGroup) {
                return;
            }
            var itemsChanged = false;
            var arrayStartIndex = itemsPerWrapGroup * wrapGroupIndex;
            for (var i = 0; i < itemsPerWrapGroup; ++i) {
                if (!this.compareItems(oldWrapGroupDimension.items[i], this.items[arrayStartIndex + i])) {
                    itemsChanged = true;
                    break;
                }
            }
            if (!itemsChanged) {
                ++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += oldWrapGroupDimension.childWidth || 0;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += oldWrapGroupDimension.childHeight || 0;
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = oldWrapGroupDimension;
            }
        }
    };
    VirtualScrollComponent.prototype.calculateDimensions = function () {
        var scrollElement = this.getScrollElement();
        var maxCalculatedScrollBarSize = 25; // Note: Formula to auto-calculate doesn't work for ParentScroll, so we default to this if not set by consuming application
        this.calculatedScrollbarHeight = Math.max(Math.min(scrollElement.offsetHeight - scrollElement.clientHeight, maxCalculatedScrollBarSize), this.calculatedScrollbarHeight);
        this.calculatedScrollbarWidth = Math.max(Math.min(scrollElement.offsetWidth - scrollElement.clientWidth, maxCalculatedScrollBarSize), this.calculatedScrollbarWidth);
        var viewportWidth = scrollElement.offsetWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth || (this.horizontal ? 0 : maxCalculatedScrollBarSize));
        var viewportHeight = scrollElement.offsetHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight || (this.horizontal ? maxCalculatedScrollBarSize : 0));
        if (common_1.isPlatformServer(this.platformId)) {
            viewportWidth = this.ssrViewportWidth;
            viewportHeight = this.ssrViewportHeight;
            this.childWidth = this.ssrChildWidth;
            this.childHeight = this.ssrChildHeight;
        }
        var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        var itemsPerWrapGroup = this.countItemsPerWrapGroup();
        var wrapGroupsPerPage;
        var defaultChildWidth;
        var defaultChildHeight;
        if (!this.enableUnequalChildrenSizes) {
            if (content.children.length > 0) {
                if (!this.childWidth || !this.childHeight) {
                    if (!this.minMeasuredChildWidth && viewportWidth > 0) {
                        this.minMeasuredChildWidth = viewportWidth;
                    }
                    if (!this.minMeasuredChildHeight && viewportHeight > 0) {
                        this.minMeasuredChildHeight = viewportHeight;
                    }
                }
                var child = content.children[0];
                var clientRect = child.getBoundingClientRect();
                this.minMeasuredChildWidth = Math.min(this.minMeasuredChildWidth, clientRect.width);
                this.minMeasuredChildHeight = Math.min(this.minMeasuredChildHeight, clientRect.height);
            }
            defaultChildWidth = this.childWidth || this.minMeasuredChildWidth || viewportWidth;
            defaultChildHeight = this.childHeight || this.minMeasuredChildHeight || viewportHeight;
            var itemsPerRow = Math.max(Math.ceil(viewportWidth / defaultChildWidth), 1);
            var itemsPerCol = Math.max(Math.ceil(viewportHeight / defaultChildHeight), 1);
            wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
        }
        else {
            var scrollOffset = scrollElement[this._scrollType] - (this.previousViewPort ? this.previousViewPort.padding : 0);
            var arrayStartIndex = this.previousViewPort.startIndexWithBuffer || 0;
            var wrapGroupIndex = Math.ceil(arrayStartIndex / itemsPerWrapGroup);
            var maxWidthForWrapGroup = 0;
            var maxHeightForWrapGroup = 0;
            var sumOfVisibleMaxWidths = 0;
            var sumOfVisibleMaxHeights = 0;
            wrapGroupsPerPage = 0;
            for (var i = 0; i < content.children.length; ++i) {
                ++arrayStartIndex;
                var child = content.children[i];
                var clientRect = child.getBoundingClientRect();
                maxWidthForWrapGroup = Math.max(maxWidthForWrapGroup, clientRect.width);
                maxHeightForWrapGroup = Math.max(maxHeightForWrapGroup, clientRect.height);
                if (arrayStartIndex % itemsPerWrapGroup === 0) {
                    var oldValue = this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
                    if (oldValue) {
                        --this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= oldValue.childWidth || 0;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= oldValue.childHeight || 0;
                    }
                    ++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                    var items = this.items.slice(arrayStartIndex - itemsPerWrapGroup, arrayStartIndex);
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = {
                        childWidth: maxWidthForWrapGroup,
                        childHeight: maxHeightForWrapGroup,
                        items: items
                    };
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += maxWidthForWrapGroup;
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += maxHeightForWrapGroup;
                    if (this.horizontal) {
                        var maxVisibleWidthForWrapGroup = Math.min(maxWidthForWrapGroup, Math.max(viewportWidth - sumOfVisibleMaxWidths, 0));
                        if (scrollOffset > 0) {
                            var scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleWidthForWrapGroup);
                            maxVisibleWidthForWrapGroup -= scrollOffsetToRemove;
                            scrollOffset -= scrollOffsetToRemove;
                        }
                        sumOfVisibleMaxWidths += maxVisibleWidthForWrapGroup;
                        if (maxVisibleWidthForWrapGroup > 0 && viewportWidth >= sumOfVisibleMaxWidths) {
                            ++wrapGroupsPerPage;
                        }
                    }
                    else {
                        var maxVisibleHeightForWrapGroup = Math.min(maxHeightForWrapGroup, Math.max(viewportHeight - sumOfVisibleMaxHeights, 0));
                        if (scrollOffset > 0) {
                            var scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleHeightForWrapGroup);
                            maxVisibleHeightForWrapGroup -= scrollOffsetToRemove;
                            scrollOffset -= scrollOffsetToRemove;
                        }
                        sumOfVisibleMaxHeights += maxVisibleHeightForWrapGroup;
                        if (maxVisibleHeightForWrapGroup > 0 && viewportHeight >= sumOfVisibleMaxHeights) {
                            ++wrapGroupsPerPage;
                        }
                    }
                    ++wrapGroupIndex;
                    maxWidthForWrapGroup = 0;
                    maxHeightForWrapGroup = 0;
                }
            }
            var averageChildWidth = this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths / this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
            var averageChildHeight = this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights / this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
            defaultChildWidth = this.childWidth || averageChildWidth || viewportWidth;
            defaultChildHeight = this.childHeight || averageChildHeight || viewportHeight;
            if (this.horizontal) {
                if (viewportWidth > sumOfVisibleMaxWidths) {
                    wrapGroupsPerPage += Math.ceil((viewportWidth - sumOfVisibleMaxWidths) / defaultChildWidth);
                }
            }
            else {
                if (viewportHeight > sumOfVisibleMaxHeights) {
                    wrapGroupsPerPage += Math.ceil((viewportHeight - sumOfVisibleMaxHeights) / defaultChildHeight);
                }
            }
        }
        var itemCount = this.items.length;
        var itemsPerPage = itemsPerWrapGroup * wrapGroupsPerPage;
        var pageCount_fractional = itemCount / itemsPerPage;
        var numberOfWrapGroups = Math.ceil(itemCount / itemsPerWrapGroup);
        var scrollLength = 0;
        var defaultScrollLengthPerWrapGroup = this.horizontal ? defaultChildWidth : defaultChildHeight;
        if (this.enableUnequalChildrenSizes) {
            var numUnknownChildSizes = 0;
            for (var i = 0; i < numberOfWrapGroups; ++i) {
                var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] && this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
                if (childSize) {
                    scrollLength += childSize;
                }
                else {
                    ++numUnknownChildSizes;
                }
            }
            scrollLength += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);
        }
        else {
            scrollLength = numberOfWrapGroups * defaultScrollLengthPerWrapGroup;
        }
        var viewportLength = this.horizontal ? viewportWidth : viewportHeight;
        var maxScrollPosition = Math.max(scrollLength - viewportLength, 0);
        return {
            itemCount: itemCount,
            itemsPerWrapGroup: itemsPerWrapGroup,
            wrapGroupsPerPage: wrapGroupsPerPage,
            itemsPerPage: itemsPerPage,
            pageCount_fractional: pageCount_fractional,
            childWidth: defaultChildWidth,
            childHeight: defaultChildHeight,
            scrollLength: scrollLength,
            viewportLength: viewportLength,
            maxScrollPosition: maxScrollPosition
        };
    };
    VirtualScrollComponent.prototype.calculatePadding = function (arrayStartIndexWithBuffer, dimensions) {
        if (dimensions.itemCount === 0) {
            return 0;
        }
        var defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
        var startingWrapGroupIndex = Math.ceil(arrayStartIndexWithBuffer / dimensions.itemsPerWrapGroup) || 0;
        if (!this.enableUnequalChildrenSizes) {
            return defaultScrollLengthPerWrapGroup * startingWrapGroupIndex;
        }
        var numUnknownChildSizes = 0;
        var result = 0;
        for (var i = 0; i < startingWrapGroupIndex; ++i) {
            var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] && this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
            if (childSize) {
                result += childSize;
            }
            else {
                ++numUnknownChildSizes;
            }
        }
        result += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);
        return result;
    };
    VirtualScrollComponent.prototype.calculatePageInfo = function (scrollPosition, dimensions) {
        var scrollPercentage = 0;
        if (this.enableUnequalChildrenSizes) {
            var numberOfWrapGroups = Math.ceil(dimensions.itemCount / dimensions.itemsPerWrapGroup);
            var totalScrolledLength = 0;
            var defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
            for (var i = 0; i < numberOfWrapGroups; ++i) {
                var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] && this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
                if (childSize) {
                    totalScrolledLength += childSize;
                }
                else {
                    totalScrolledLength += defaultScrollLengthPerWrapGroup;
                }
                if (scrollPosition < totalScrolledLength) {
                    scrollPercentage = i / numberOfWrapGroups;
                    break;
                }
            }
        }
        else {
            scrollPercentage = scrollPosition / dimensions.scrollLength;
        }
        var startingArrayIndex_fractional = Math.min(Math.max(scrollPercentage * dimensions.pageCount_fractional, 0), dimensions.pageCount_fractional) * dimensions.itemsPerPage;
        var maxStart = dimensions.itemCount - dimensions.itemsPerPage - 1;
        var arrayStartIndex = Math.min(Math.floor(startingArrayIndex_fractional), maxStart);
        arrayStartIndex -= arrayStartIndex % dimensions.itemsPerWrapGroup; // round down to start of wrapGroup
        var arrayEndIndex = Math.ceil(startingArrayIndex_fractional) + dimensions.itemsPerPage - 1;
        arrayEndIndex += (dimensions.itemsPerWrapGroup - ((arrayEndIndex + 1) % dimensions.itemsPerWrapGroup)); // round up to end of wrapGroup
        if (isNaN(arrayStartIndex)) {
            arrayStartIndex = 0;
        }
        if (isNaN(arrayEndIndex)) {
            arrayEndIndex = 0;
        }
        arrayStartIndex = Math.min(Math.max(arrayStartIndex, 0), dimensions.itemCount - 1);
        arrayEndIndex = Math.min(Math.max(arrayEndIndex, 0), dimensions.itemCount - 1);
        var bufferSize = this.bufferAmount * dimensions.itemsPerWrapGroup;
        var startIndexWithBuffer = Math.min(Math.max(arrayStartIndex - bufferSize, 0), dimensions.itemCount - 1);
        var endIndexWithBuffer = Math.min(Math.max(arrayEndIndex + bufferSize, 0), dimensions.itemCount - 1);
        return {
            startIndex: arrayStartIndex,
            endIndex: arrayEndIndex,
            startIndexWithBuffer: startIndexWithBuffer,
            endIndexWithBuffer: endIndexWithBuffer,
            scrollStartPosition: scrollPosition,
            scrollEndPosition: scrollPosition + dimensions.viewportLength,
            maxScrollPosition: dimensions.maxScrollPosition
        };
    };
    VirtualScrollComponent.prototype.calculateViewport = function () {
        var dimensions = this.calculateDimensions();
        var offset = this.getElementsOffset();
        var scrollStartPosition = this.getScrollStartPosition();
        if (scrollStartPosition > dimensions.scrollLength && !(this.parentScroll instanceof Window)) {
            scrollStartPosition = dimensions.scrollLength;
        }
        else {
            scrollStartPosition -= offset;
        }
        scrollStartPosition = Math.max(0, scrollStartPosition);
        var pageInfo = this.calculatePageInfo(scrollStartPosition, dimensions);
        var newPadding = this.calculatePadding(pageInfo.startIndexWithBuffer, dimensions);
        var newScrollLength = dimensions.scrollLength;
        return {
            startIndex: pageInfo.startIndex,
            endIndex: pageInfo.endIndex,
            startIndexWithBuffer: pageInfo.startIndexWithBuffer,
            endIndexWithBuffer: pageInfo.endIndexWithBuffer,
            padding: Math.round(newPadding),
            scrollLength: Math.round(newScrollLength),
            scrollStartPosition: pageInfo.scrollStartPosition,
            scrollEndPosition: pageInfo.scrollEndPosition,
            maxScrollPosition: pageInfo.maxScrollPosition
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
                    styles: ["\n    :host {\n      position: relative;\n\t  display: block;\n      -webkit-overflow-scrolling: touch;\n    }\n\t\n\t:host.horizontal.selfScroll {\n      overflow-y: visible;\n      overflow-x: auto;\n\t}\n\t:host.vertical.selfScroll {\n      overflow-y: auto;\n      overflow-x: visible;\n\t}\n\t\n    .scrollable-content {\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      max-width: 100vw;\n      max-height: 100vh;\n      position: absolute;\n    }\n\n\t.scrollable-content ::ng-deep > * {\n\t\tbox-sizing: border-box;\n\t}\n\t\n\t:host.horizontal {\n\t\twhite-space: nowrap;\n\t}\n\t\n\t:host.horizontal .scrollable-content {\n\t\tdisplay: flex;\n\t}\n\t\n\t:host.horizontal .scrollable-content ::ng-deep > * {\n\t\tflex-shrink: 0;\n\t\tflex-grow: 0;\n\t\twhite-space: initial;\n\t}\n\t\n    .total-padding {\n      width: 1px;\n      opacity: 0;\n    }\n    \n    :host.horizontal .total-padding {\n      height: 100%;\n    }\n  "]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollComponent.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: core_1.Renderer2, },
        { type: core_1.NgZone, },
        { type: Object, decorators: [{ type: core_1.Inject, args: [core_2.PLATFORM_ID,] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: ['virtualScroll.scrollThrottlingTime',] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: ['virtualScroll.scrollAnimationTime',] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: ['virtualScroll.scrollbarWidth',] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: ['virtualScroll.scrollbarHeight',] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: ['virtualScroll.checkResizeInterval',] },] },
        { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: ['virtualScroll.resizeBypassRefreshThreshold',] },] },
    ]; };
    VirtualScrollComponent.propDecorators = {
        'enableUnequalChildrenSizes': [{ type: core_1.Input },],
        'useMarginInsteadOfTranslate': [{ type: core_1.Input },],
        'scrollbarWidth': [{ type: core_1.Input },],
        'scrollbarHeight': [{ type: core_1.Input },],
        'childWidth': [{ type: core_1.Input },],
        'childHeight': [{ type: core_1.Input },],
        'ssrChildWidth': [{ type: core_1.Input },],
        'ssrChildHeight': [{ type: core_1.Input },],
        'ssrViewportWidth': [{ type: core_1.Input },],
        'ssrViewportHeight': [{ type: core_1.Input },],
        'bufferAmount': [{ type: core_1.Input },],
        'scrollAnimationTime': [{ type: core_1.Input },],
        'resizeBypassRefreshThreshold': [{ type: core_1.Input },],
        'scrollThrottlingTime': [{ type: core_1.Input },],
        'checkResizeInterval': [{ type: core_1.Input },],
        'items': [{ type: core_1.Input },],
        'compareItems': [{ type: core_1.Input },],
        'horizontal': [{ type: core_1.Input },],
        'parentScroll': [{ type: core_1.Input },],
        'update': [{ type: core_1.Output },],
        'vsUpdate': [{ type: core_1.Output },],
        'change': [{ type: core_1.Output },],
        'vsChange': [{ type: core_1.Output },],
        'start': [{ type: core_1.Output },],
        'vsStart': [{ type: core_1.Output },],
        'end': [{ type: core_1.Output },],
        'vsEnd': [{ type: core_1.Output },],
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
                    imports: [common_2.CommonModule]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollModule.ctorParameters = function () { return []; };
    return VirtualScrollModule;
}());
exports.VirtualScrollModule = VirtualScrollModule;
//# sourceMappingURL=virtual-scroll.js.map