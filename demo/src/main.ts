import './polyfills.ts';
import * as MenuSpy from 'menuspy';
import { AppModule } from './app/';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Statics
import 'rxjs/add/observable/throw';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);

document.addEventListener('DOMContentLoaded', function () {
    new MenuSpy(document.querySelector('#main-header'), {
        activeClass: 'selected'
    });
});
