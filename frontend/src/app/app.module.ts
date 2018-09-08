import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from "@angular/common/http";
import {
  MatGridListModule
} from "@angular/material";

import { AppComponent } from './app.component';
import { VolumesComponent } from './volumes/volumes.component';

const appRoutes: Routes = [
  {
    path: 'volumes',
    component: VolumesComponent,
    data: { title: 'Volume' }
  },
  {
    path: '',
    redirectTo: '/volumes',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    VolumesComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    HttpClientModule,
    MatGridListModule
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
