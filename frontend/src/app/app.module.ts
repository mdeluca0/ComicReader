import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatCardModule,
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatProgressSpinnerModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatMenuModule,
  MatInputModule
} from "@angular/material";

import { AppComponent } from './app.component';
import { VolumesComponent } from './volumes/volumes.component';
import { VolumeComponent } from './volume/volume.component';
import { IssueComponent } from './issue/issue.component';
import { DescriptionTextComponent } from './description-text/description-text.component';
import { ReaderComponent } from './reader/reader.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { VolumeCardComponent } from './volume-card/volume-card.component';
import { IssueCardComponent } from './issue-card/issue-card.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { StoryArcComponent } from './story-arc/story-arc.component';

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
    path: 'story-arc/:id',
    component: StoryArcComponent
  },
  {
    path: 'results',
    component: SearchResultsComponent
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
    ReaderComponent,
    MainMenuComponent,
    VolumeCardComponent,
    IssueCardComponent,
    SearchResultsComponent,
    StoryArcComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatInputModule
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
