
# v0.1.7

* import rxjs operators and object needed instead of RxJS library itself

# v0.1.6

* improve performance by using Observables for scroll event
* add attribute selector
* fixes #39 - infinite event loop with empty items array

# v0.1.5

* Bug fix: the data to "jump" once scrolled to the bottom, because maxStart is assumed to be evenly divisible by the number of items in each row. [#32](https://github.com/rintoj/angular2-virtual-scroll/issues/32)

# v0.1.4

* Bug fix: ensure that onScrollListener is actually defined before removing [#25](https://github.com/rintoj/angular2-virtual-scroll/issues/25)

# v0.1.3

* Feature: Add event "start", to be fired when at the beginning of the list
* Feature: Add event "end", to be fired when at the end of the list
* Bug Fix: BUG infinite request on (change) - use "end" instead of "change" [#20](https://github.com/rintoj/angular2-virtual-scroll/issues/20)

# v0.1.2

* Feature: Fire change event after startup [#21](https://github.com/rintoj/angular2-virtual-scroll/issues/21)

# v0.1.1

* Bug Fix: Update to lower amount of Elements, scroll issue, empty space on bottom [#22](https://github.com/rintoj/angular2-virtual-scroll/issues/22)

# v0.1.0

* Feature: [enable AoT #16](https://github.com/rintoj/angular2-virtual-scroll/issues/16)

# v0.0.9

* Feature: [Smooth scroll on webkit (mobile) #13](https://github.com/rintoj/angular2-virtual-scroll/issues/4) & [data from server #7](https://github.com/rintoj/angular2-virtual-scroll/issues/13)

# v0.0.8

* Feature: [Using virtual scroll with api #4](https://github.com/rintoj/angular2-virtual-scroll/issues/4) & [data from server #7](https://github.com/rintoj/angular2-virtual-scroll/issues/7)

# v0.0.7

* Bug fix: [Multi-column scroll is broken in the demo #6](https://github.com/rintoj/angular2-virtual-scroll/issues/6)

# v0.0.6

* Updating documentation

# v0.0.5

* Merging pull request: [Completely define ngOnChanges function signature #2](https://github.com/rintoj/angular2-virtual-scroll/pull/2)

# v0.0.4

* BREAKING CHANGE: Removed `marginX` and `marginY`. These are auto calculated now.
* Added support for list items with variable width and height. Use `childWidth` and `childHeight`
* Performance turning: removed padding using `height`. Now uses `transform`.

# v0.0.3

* Bug fix: virtual-scroll.js:73 Uncaught ReferenceError: __decorate is not defined #1

# v0.0.2

* Initial version
