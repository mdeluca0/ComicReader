import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatCardModule
} from "@angular/material";

import { AppComponent } from './app.component';
import { VolumesComponent } from './volumes/volumes.component';
import { VolumeComponent } from './volume/volume.component';
import { IssueComponent } from './issue/issue.component';
import { DescriptionTextComponent } from './description-text/description-text.component';
import { ReaderComponent } from './reader/reader.component';

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
    path: 'issues/:id',
    component: IssueComponent
  },
  {
    path: 'reader/:id',
    component: ReaderComponent
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
    VolumeComponent,
    IssueComponent,
    DescriptionTextComponent,
    ReaderComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatCardModule
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
