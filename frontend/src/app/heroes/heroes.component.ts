import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  // styleUrl: './heroes.component.scss'
})
export class HeroesComponent {

  constructor(private http: HttpClient) { }

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
  }

  onButtonClick() {
    const body = {
      code: this.value
    }
    this.response = 'Loading...';
    this.http.post<any>('/api/parse_and_exec', body).subscribe(data => {
      this.response = data.result;
    })
  }

}
