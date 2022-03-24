import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountComponent } from './account.component';
import { RouterModule, Routes } from '@angular/router';
import { PartialsModule } from '../../partials/partials.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AccountResolverService } from '../../../core/resolvers/general/account/account-resolver.service';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { MatCheckboxModule, MatProgressSpinnerModule, MatSliderModule, MatTooltipModule } from '@angular/material';
import { SelectFromCloudComponent } from './select-from-cloud/select-from-cloud.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
	{
		path: '',
		component: AccountComponent,
		resolve: { AccountResolverService }
	}
];

@NgModule({
  declarations: [AccountComponent, SelectFromCloudComponent],
  imports: [
	CommonModule,
	  RouterModule.forChild(routes),
	  PartialsModule,
	  MatSnackBarModule,
	  PerfectScrollbarModule,
	  NgxDropzoneModule,
	  MatSliderModule,
	  MatCheckboxModule,
	  MatTooltipModule,
	  MatProgressSpinnerModule,
	  TranslateModule.forChild()
  ]
})
export class AccountModule { }
