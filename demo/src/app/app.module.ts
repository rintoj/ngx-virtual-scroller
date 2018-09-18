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

import { HorizontalListComponent } from "./lists/horizontal-list.component";
import { ListWithApiComponent } from './lists/list-with-api.component';
import { MultiColListComponent } from './lists/multi-col-list.component';
import { TableListComponent } from './lists/table-list.component';
import { VerticalListComponent } from './lists/vertical-list.component';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

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
    VirtualScrollModule
  ],
  providers: [
    {  provide: 'virtualScroll.scrollThrottlingTime', useValue: 50  },
    {  provide: 'virtualScroll.scrollAnimationTime', useValue: 800  }
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
