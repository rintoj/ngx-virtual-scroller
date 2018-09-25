import { AppComponent } from './app.component';
import { RouterModule, Router } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';

import { AboutComponent } from './routes/about.component';
import { DemoComponent } from './routes/demo.component';
import { ParentScrollComponent } from './routes/parentScroll.component';
import { SamplesComponent } from './routes/samples.component';

import { ListItemComponent } from './lists/list-item.component';

import { HorizontalListComponent } from './lists/horizontal-list.component';
import { ListWithApiComponent } from './lists/list-with-api.component';
import { MultiColListComponent } from './lists/multi-col-list.component';
import { TableListComponent } from './lists/table-list.component';
import { VerticalListComponent } from './lists/vertical-list.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';

@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    DemoComponent,
    ParentScrollComponent,
    SamplesComponent,
    ListItemComponent,
    ListWithApiComponent,
    MultiColListComponent,
    TableListComponent,
    VerticalListComponent,
    HorizontalListComponent,
  ],
  imports: [
    RouterModule.forRoot(
      [
        { path: 'demo', component: DemoComponent },
        { path: 'about', component: AboutComponent },
        { path: 'samples', component: SamplesComponent },
        { path: 'parentScroll', component: ParentScrollComponent },
        { path: '**', redirectTo: '/about', pathMatch: 'full' }
      ]
    ),
    BrowserModule,
    FormsModule,
    HttpModule,
    VirtualScrollerModule
  ],
  providers: [
    { provide: 'virtualScroller.scrollThrottlingTime', useValue: 0 },
    { provide: 'virtualScroller.scrollAnimationTime', useValue: 750 },
    { provide: 'virtualScroller.scrollbarWidth', useValue: undefined },
    { provide: 'virtualScroller.scrollbarHeight', useValue: undefined },
    { provide: 'virtualScroller.checkResizeInterval', useValue: 1000 },
    { provide: 'virtualScroller.resizeBypassRefreshThreshold', useValue: 5 }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(router: Router) {
    router.events.subscribe(() => {
      setTimeout(() => {
        window['hljs'].initHighlighting.called = false;
        window['hljs'].initHighlighting();
      }, 0);
    });
  }
}
