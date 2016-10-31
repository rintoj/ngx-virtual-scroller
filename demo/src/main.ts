import './polyfills.ts';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule } from './app/';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);

import * as MenuSpy from 'menuspy';

 document.addEventListener('DOMContentLoaded', function() {
    var elm = document.querySelector('#main-header');
    var ms = new MenuSpy(elm, {
    activeClass: 'selected'
    });
});
