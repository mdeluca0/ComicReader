import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatGridListModule,
  MatListModule,
  MatExpansionModule
} from "@angular/material";

import { AppComponent } from './app.component';
import { VolumesComponent } from './volumes/volumes.component';
import { VolumeComponent } from './volume/volume.component';

const appRoutes: Routes = [
  {
    path: 'volumes',
    component: VolumesComponent
  },
  {
    path: 'volumes/:id',
    component: VolumeComponent
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
    VolumesComponent,
    VolumeComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatListModule,
    MatExpansionModule
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
