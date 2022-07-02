import { NgModule } from '@angular/core';
import {
  VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY,
  VirtualScrollerComponent
} from './ngx-virtual-scroller.component';
import {CommonModule} from "@angular/common";

@NgModule({
  exports: [VirtualScrollerComponent],
  declarations: [VirtualScrollerComponent],
  imports: [CommonModule],
  providers: [
    {
      provide: 'virtual-scroller-default-options',
      useFactory: VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY
    }
  ]
})
export class VirtualScrollerModule { }
