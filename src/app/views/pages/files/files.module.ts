import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FilesRoutingModule } from './files-routing.module';
import { FilesComponent } from './files.component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { MatProgressBarModule, MatIconModule, MatProgressSpinnerModule } from '@angular/material';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NameTrimPipe } from './name-trim.pipe';
import { ClickOutsideModule } from 'ng-click-outside';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [FilesComponent, NameTrimPipe],
  imports: [
    CommonModule,
    FilesRoutingModule,
    NgxDropzoneModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatIconModule,
    ClickOutsideModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    FormsModule
  ]
})
export class FilesModule { }
