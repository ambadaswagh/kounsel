import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsConditionComponent } from './terms-condition/terms-condition.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [TermsConditionComponent],
  imports: [
    CommonModule,
    MatCheckboxModule,
    PerfectScrollbarModule,
    FormsModule
  ],
  exports: [
    CommonModule, TermsConditionComponent
  ]
})
export class LegalModule { }
