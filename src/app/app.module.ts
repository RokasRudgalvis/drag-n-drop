import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {OtherComponent} from './other/other.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClient} from '@angular/common/http';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {DragNDropModule} from '../lib/drag-n-drop/src/drag-n-drop.module';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http);
}

@NgModule({
    declarations: [
        AppComponent,
        OtherComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        DragNDropModule
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
