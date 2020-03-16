# v4.0.3

* Support for 1000000+ items

# v4.0.2

* Add RTL Support
* Minor bug fixes
* Compiled from Angular 9

# v3.0.3

* Add Null-Safety check

# v3.0.2

* Bug fix when prepending items (was scrolling to previously visible item even if scroll was at top of list)

# v3.0.1

* Use new Angular8 syntax for ViewChild/ContentChild (https://angular.io/guide/static-query-migration)

# v3.0.0

* If items array is prepended with additional items, keep scroll on currently visible items, if possible.
* Removed ChangeEvent (replaced by IPageInfo)
* Removed several deprecated properties (ChangeEvent.start, ChangeEvent.end, update/change/start/end events [renamed to vsUpdate/vsChange/vsStart/vsEnd])
* Auto-refresh improvement: During ngDoCheck, evaluates if javascript objects associated with any currently visible items have been replaced with different objects (for example: items array has been sorted, but still has the same items & length).

# v2.1.0

* Syntax of Dependency Injection changed

# v2.0.9

* Include margin in calculations for element size to improve smoothness of scrolling

# v2.0.7

* Add "sideEffects": true flag to package.json to prevent advanced optimizations which were causing runtime exceptions (due to get/set properties not being 'pure').

# v2.0.6

* Use ng-packagr to properly format npm publish for Angular consumption (Ivy support)

# v2.0.3

* Switch to ES2015 Module (instead of CommonJS) to support Ivy.

# v2.0.2

* Update to latest version of Angular & switch to ES2015 Module (instead of CommonJS) to support Ivy.

# v1.0.17

* Bug fix: bufferAmount < 5 was forced to 5 if enableUnequalChildrenSizes==true.

# v1.0.16

* Bug fix to sticky header with parentScroll

# v1.0.15

* Minor bug fix to stripedTable & table headers.

# v1.0.14

* New properties stripedTable and modifyOverflowStyleOfParentScroll. Minor bug fix to fixed table headers.

# v1.0.13

* Make OnPush strategy easier to implement.

# v1.0.12

* Fix a bug when parentScroll is significantly longer than virtual scroller.

# v1.0.11

* Fix issue #258

# v1.0.10

* Refactor of speed improvement flag (renamed to executeRefreshOutsideAngularZone). With instructions & warning.

# v1.0.9

* Add flag to enable speed improvement from v1.0.8 (because it causes issues with `changeDetection: ChangeDetectionStrategy.OnPush`.

# v1.0.8

* Speed improvement. Thanks to sharikovvladislav & nickbullock !

# v1.0.7

* Fix bug where viewportItems had an extra row of invisible items outside viewport (also affected vsStart/vsEnd/vsChange.endIndex)

# v1.0.6

* Add new properties to vsStart/vsEnd/vsChange events. Remove viewPortIndices property, because it's been replaced by viewPortInfo.

# v1.0.5

* Support for fixed <thead> on <table> tags.

# v1.0.4

* Add ScrollDebounceTime

# v1.0.3

* Rename everything from virtual-scroll to virtual-scroller and from virtualScroll to virtualScroller

# v1.0.2

* Improve AngularUniversal/SSR support

# v1.0.1

* Renamed from angular2-virtual-scroll to ngx-virtual-scroller

# v0.4.15

* New properties to support AngularUniversal/ServerSideRendering (SSR)

# v0.4.14

* Fix regression 'TypeError: Cannot read property 'sumOfKnownWrapGroupChildWidths' of undefined'

# v0.4.13

* Support for dependency injection of some configuration properties
* New APIs: scrollToPosition, invalidateAllCachedMeasurements, invalidateCachedMeasurementForItem, invalidateCachedMeasurementAtIndex, viewPortInfo
* ScrollStartPosition, ScrollEndPosition, MaxScrollPosition properties added to ChangeEvent

# v0.4.12

* viewPortIndices.arrayStartIndex renamed to viewPortIndices.startIndex and viewPortIndices.arrayEndIndex renamed to viewPortIndices.endIndex
* Fix scrollbar measurements (horizontal/vertical calculations were backwards)
* After component is removed it reverts css overflow-x/overflow-y of parentScroll back to their original values.
* Previously, if scroll parent was resized it would automatically call Refresh. This still occurs, except if new size is 0.
* Breaking Change: The start and end values of the change/start/end events were including bufferAmount, which made them confusing. This has been corrected.

# v0.4.11

* Bug fix to items array modifications with "enableUnequalChildrenSizes" which caused non-modified items to have to be re-measured.

# v0.4.10

* Minor bug fixes.
* Prevent delay if scrollThrottlingTime is set to 0.
* Fix bug where children would not be re-measured if their original measurement was 0 (due to elements still initializing)
* Add vs* prefix to event names to prevent conflicts with native DOM events, example: <virtual-scroller (vsChange)=""><input (change)="" /></virtual-scroller>

# v0.4.9

* Default scrollThrottlingTime to 0.

# v0.4.8

* Improvements to "enableUnequalChildrenSizes". Thanks to Pavel Kukushkin (kykint) for Pull-Request.
* Add scrollThrottlingTime parameter for performance reasons.
* Use style box-sizing: border-box on child elements of viewport to enable padding/border to be taken into account when calculating sizes.

# v0.4.7

* useMarginInsteadOfTranslate flag. Defaults to false. This can affect performance (better/worse depending on your circumstances), and also creates a workaround for the transform+position:fixed browser bug.

# v0.4.6

* Update Readme

# v0.4.5

* Update Readme

# v0.4.4

* Added ability to use virtual scroll with different sized of elements
* flag "enableUnequalChildrenSizes" was added (defaults to false) to bypass the different-height elements calculations (for users with fixed-height children to avoid the minor performance impact).
Breaking Change: The value of ChangeEvent.end wasn't intuitive. This has been corrected. Both ChangeEvent.start and ChangeEvent.end are the 0-based array indexes of the items being rendered in the viewport. (Previously Change.End was the array index + 1)

# v0.3.4

* revert package.json to Angular 4 instead of Angular 6 since they should be backwards compatible

# v0.3.3

* update to latest npm versions. fix parentScroll. support horizontal scrollbars. auto-calculate scrollbar size. auto-refresh if items array changes. minor bug fixes

# v0.3.2

* Merge PR [!159](https://github.com/rintoj/ngx-virtual-scroller/pull/159), [!165](https://github.com/rintoj/ngx-virtual-scroller/pull/165), [!167](https://github.com/rintoj/ngx-virtual-scroller/pull/167), [!168](https://github.com/rintoj/ngx-virtual-scroller/pull/168)

# v0.3.1

* Merge PR [!117](https://github.com/rintoj/ngx-virtual-scroller/pull/117) - Run scroll and frame handlers outside of angular zone for performance

# v0.3.0

* Add smooth scroll for `scrollInto` function.

# v0.2.2

* Fixes #94

# v0.2.1

* Added ability to get viewPortItems as a field instead of event
* Added easier ability of using window scrollbar

# v0.2.0

* Added ability to put other elements inside of scroll (Need to wrap list itself in @ContentChild('container'))
* Added ability to use any parent with scrollbar instead of this element (@input() parentScroll)

# v0.1.8

* fixes [#74](https://github.com/rintoj/ngx-virtual-scroller/issues/74)
* fix buffer for scroll to top amount [#71](https://github.com/rintoj/ngx-virtual-scroller/issues/71)

# v0.1.7

* import rxjs operators and object needed instead of RxJS library itself

# v0.1.6

* improve performance by using Observables for scroll event
* add attribute selector
* fixes #39 - infinite event loop with empty items array

# v0.1.5

* Bug fix: the data to "jump" once scrolled to the bottom, because maxStart is assumed to be evenly divisible by the number of items in each row. [#32](https://github.com/rintoj/ngx-virtual-scroller/issues/32)

# v0.1.4

* Bug fix: ensure that onScrollListener is actually defined before removing [#25](https://github.com/rintoj/ngx-virtual-scroller/issues/25)

# v0.1.3

* Feature: Add event "start", to be fired when at the beginning of the list
* Feature: Add event "end", to be fired when at the end of the list
* Bug Fix: BUG infinite request on (change) - use "end" instead of "change" [#20](https://github.com/rintoj/ngx-virtual-scroller/issues/20)

# v0.1.2

* Feature: Fire change event after startup [#21](https://github.com/rintoj/ngx-virtual-scroller/issues/21)

# v0.1.1

* Bug Fix: Update to lower amount of Elements, scroll issue, empty space on bottom [#22](https://github.com/rintoj/ngx-virtual-scroller/issues/22)

# v0.1.0

* Feature: [enable AoT #16](https://github.com/rintoj/ngx-virtual-scroller/issues/16)

# v0.0.9

* Feature: [Smooth scroll on webkit (mobile) #13](https://github.com/rintoj/ngx-virtual-scroller/issues/4) & [data from server #7](https://github.com/rintoj/ngx-virtual-scroller/issues/13)

# v0.0.8

* Feature: [Using virtual scroll with api #4](https://github.com/rintoj/ngx-virtual-scroller/issues/4) & [data from server #7](https://github.com/rintoj/ngx-virtual-scroller/issues/7)

# v0.0.7

* Bug fix: [Multi-column scroll is broken in the demo #6](https://github.com/rintoj/ngx-virtual-scroller/issues/6)

# v0.0.6

* Updating documentation

# v0.0.5

* Merging pull request: [Completely define ngOnChanges function signature #2](https://github.com/rintoj/ngx-virtual-scroller/pull/2)

# v0.0.4

* BREAKING CHANGE: Removed `marginX` and `marginY`. These are auto calculated now.
* Added support for list items with variable width and height. Use `childWidth` and `childHeight`
* Performance turning: removed padding using `height`. Now uses `transform`.

# v0.0.3

* Bug fix: virtual-scroller.js:73 Uncaught ReferenceError: __decorate is not defined #1

# v0.0.2

* Initial version
