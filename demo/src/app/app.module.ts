import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ListItemComponent } from './lists/list-item.component';
import { ListWithApiComponent } from './lists/list-with-api.component';
import { MultiColListComponent } from './lists/multi-col-list.component';
import { NgModule } from '@angular/core';
import { TableListComponent } from './lists/table-list.component';
import { VerticalListComponent } from './lists/vertical-list.component';
import { VirtualScrollModule } from '../../../src/virtual-scroll';

@NgModule({
  declarations: [
    AppComponent,
    ListItemComponent,
    ListWithApiComponent,
    MultiColListComponent,
    TableListComponent,
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
