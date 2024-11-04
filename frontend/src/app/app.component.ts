import { AfterViewInit, ChangeDetectorRef, Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Store } from '@ngrx/store';

import { environment } from 'environments/environment';
import { PyodideService } from './localbackend/local.service';
import { selectIsLoading } from './toast/toast.reducer';
import { CodeApiActions } from './heroes/heros.reducer';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {

  isLoading = false;

  constructor(
    private store: Store,
    @Inject(PLATFORM_ID) private platformId: Object,
    private pyodideService: PyodideService,
    private cdf: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {  // only run in browser, load pyodide
      this.pyodideService.initLoadPyodide();
    }
    if (!environment.production) {
      console.log('IN DEBUG MODE');
      console.log('Dispatching data');
      this.store.dispatch(CodeApiActions.execDiceCodeSuccess({ response: environment.debugData.dataProgs[0] }));
    } else {
      console.log('running in production');
    }
    this.store.select(selectIsLoading).subscribe(isLoading => {
      this.isLoading = isLoading;
      this.cdf.detectChanges();
    });
  }

}
