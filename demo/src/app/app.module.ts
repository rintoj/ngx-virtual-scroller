import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { ListItemComponent } from './lists/list-item.component';
import { VerticalListComponent } from './lists/vertical-list.component';
import { MultiColListComponent } from './lists/multi-col-list.component';
import { VirtualScrollModule } from '../../../src/virtual-scroll';

@NgModule({
    declarations: [
        AppComponent,
        ListItemComponent,
        MultiColListComponent,
        VerticalListComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        VirtualScrollModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
