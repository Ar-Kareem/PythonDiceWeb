// @ts-nocheck

import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef  } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrl: './heroes.component.scss'
})
export class HeroesComponent implements AfterViewInit {

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) { }

  sidebarVisible: boolean = true;

  @ViewChild('autoResizeTextarea') textarea: ElementRef<HTMLTextAreaElement>;

  // value is stored in primeng textarea 
  value: string = `
output 5d2
output 1d20 + 1d4 + 2
output (1d20 + 1d4 + 2) > 10
`;
  // response is stored in primeng 
  response: string = '';
  

  ngOnInit(): void {
    console.log('Welcome to the Dice App!');
    if (typeof window !== 'undefined') {
      window.heros = this;
    }
  }

  ngAfterViewInit() {
    this.autoOutputHeight();
    
    // Load input from localStorage
    if (localStorage.getItem('input')) {
      this.value = localStorage.getItem('input');
      this.cd.detectChanges();
    }
  }

  lastSave;
  saveInputLocalStorage() {
    if (this.lastSave && Date.now() - this.lastSave < 3000) {
      return;
    }
    console.log('saveInputLocalStorage');
    this.lastSave = Date.now();
    localStorage.setItem('input', this.value);
  }

  autoOutputHeight() {
    console.log('autoOutputHeight');
    const textarea = this.textarea.nativeElement;
    textarea.style.height = 'auto'; // Reset height to auto to shrink if needed
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on scrollHeight
    this.cd.detectChanges();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible
  }

  onButtonClick() {
    const body = {
      code: this.value
    }
    this.response = 'Loading...';
    this.http.post<any>('/api/parse_and_exec', body).subscribe(data => {
      this.response = data.result;
      setTimeout(() => {
        this.autoOutputHeight();
      }, 1);
    })
  }

}
