import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeroesComponent } from './heroes/heroes.component';
import { TabviewComponent } from './tabview/tabview.component';

const routes: Routes = [
  { path: 'emptyTabExample', component: TabviewComponent },
  { path: 'program/:progId', component: HeroesComponent },
  { path: '', component: HeroesComponent },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
