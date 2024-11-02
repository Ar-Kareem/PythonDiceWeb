import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { SidebarModule } from 'primeng/sidebar';
import { TabViewModule } from 'primeng/tabview';
import { MessagesModule } from 'primeng/messages';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CardModule } from 'primeng/card';
import { BlockUIModule } from 'primeng/blockui';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastComponent } from './toast/toast.component';
import { HeroesComponent } from './heroes/heroes.component';
import { TabviewComponent } from './tabview/tabview.component';
import { GuiOutputComponent } from './outputs/gui-output/gui-output.component';
import { GuiCompComponent } from './outputs/gui-output/gui-comp/gui-comp.component';

import { herosFeatureKey, herosReducer } from './heroes/heros.reducer';
import { toastFeatureKey, toastReducer } from './toast/toast.reducer';
import { tabviewFeatureKey, tabviewReducer } from './tabview/tabview.reducer';
import { HerosEffects } from './heroes/heros.effects';
import { GuiProdComponent } from './outputs/gui-output/gui-prod/gui-prod.component';
import { PyodideService } from './localbackend/local.service';
import { OutputareaComponent } from './outputs/outputarea/outputarea.component';
import { OutputchartComponent } from './outputs/outputarea/outputchart/outputchart.component';
import { RollerComponent } from './outputs/outputarea/roller/roller.component';
import { ExporterComponent } from './outputs/outputarea/exporter/exporter.component';
import { loadInterceptor } from './getprog/http-interceptor';

@NgModule({
  declarations: [
    AppComponent,
    ToastComponent,
    HeroesComponent,
    TabviewComponent,
    GuiOutputComponent,
    GuiCompComponent,
    GuiProdComponent,
    OutputareaComponent,
    OutputchartComponent,
    RollerComponent,
    ExporterComponent,
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
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    DropdownModule,
    OverlayPanelModule,
    CheckboxModule,
    InputNumberModule,
    RadioButtonModule,
    ProgressBarModule,
    PanelMenuModule,
    FloatLabelModule,
    CardModule,
    BlockUIModule,
    EffectsModule.forRoot([
      HerosEffects
    ]),
    StoreModule.forRoot({ 
      [herosFeatureKey]: herosReducer,
      [toastFeatureKey]: toastReducer,
      [tabviewFeatureKey]: tabviewReducer,
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi(),
    ),
    { provide: HTTP_INTERCEPTORS, useClass: loadInterceptor, multi: true },
    PyodideService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
