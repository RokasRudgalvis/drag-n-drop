import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CommonModule} from '@angular/common';
import {DragNDropDirective} from './Directives/drag-n-drop.directive';

@NgModule({
    imports: [
        BrowserAnimationsModule,
        CommonModule,
    ],
    declarations: [
        DragNDropDirective
    ],
    exports: [
        DragNDropDirective
    ]
})
export class DragNDropModule {
}
