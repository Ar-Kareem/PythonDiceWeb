import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { SidebarModule } from 'primeng/sidebar';
import { TabViewModule } from 'primeng/tabview';
import { MessagesModule } from 'primeng/messages';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeroesComponent } from './heroes/heroes.component';
import { ToastComponent } from './toast/toast.component';

import { herosFeatureKey, herosReducer } from './heroes/heros.reducer';
import { toastFeatureKey, toastReducer } from './toast/toast.reducer';
import { HerosEffects } from './heroes/heros.effects';
import { TabviewComponent } from './tabview/tabview.component';
import { tabviewFeatureKey, tabviewReducer } from './tabview/tabview.reducer';

@NgModule({
  declarations: [
    AppComponent,
    HeroesComponent,
    ToastComponent,
    TabviewComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,

    InputTextareaModule,
    ButtonModule,
    PanelModule,
    SidebarModule,
    TabViewModule,
    MessagesModule,
    ConfirmDialogModule,
    ToastModule,
    DropdownModule,
    EffectsModule.forRoot([
      HerosEffects
    ]),
    StoreModule.forRoot({ 
      [herosFeatureKey]: herosReducer,
      [toastFeatureKey]: toastReducer,
      [tabviewFeatureKey]: tabviewReducer,
    }),
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }