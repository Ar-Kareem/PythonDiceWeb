import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Store } from '@ngrx/store';

import { PyodideService } from './heroes/local.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {


  constructor(
    private store: Store,
    @Inject(PLATFORM_ID) private platformId: Object,
    private pyodideService: PyodideService
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {  // only run in browser, load pyodide
      this.pyodideService.initLoadPyodide();
    }
  }

}
