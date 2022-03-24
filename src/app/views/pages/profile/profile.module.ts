import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { PartialsModule } from '../../partials/partials.module';
import { ProfileResolverService } from '../../../core/resolvers/profile/profile-resolver.service';
import { SkillsComponent } from './skills/skills.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { KeywordsComponent } from './keywords/keywords.component';
import { DescriptionComponent } from './description/description.component';
import { SelectionComponent } from './selection/selection.component';
import { LicenseComponent } from './license/license.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { AvailabilityComponent } from './availability/availability.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { MatIconModule, MatDatepickerModule, MatCheckboxModule, MatProgressSpinnerModule } from '@angular/material';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { LocationComponent } from './location/location.component';
import { RemoveLeadingZeroPipe } from './pipes/remove-leading-zero.pipe';
import { PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface, PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { ProfileImageComponent } from './profile-image/profile-image.component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { MatSliderModule } from '@angular/material/slider';
import { AttachmentComponent } from './attachment/attachment.component';
import { NameTrimPipe } from './pipes/name-trim.pipe';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxCurrencyModule } from 'ngx-currency';
import { SelectFromCloudComponent } from './select-from-cloud/select-from-cloud.component';
import { TranslateModule } from '@ngx-translate/core';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
	wheelSpeed: 0.5,
	swipeEasing: true,
	minScrollbarLength: 40,
	maxScrollbarLength: 300,
};

const routes: Routes = [
	{
		path: '',
		component: ProfileComponent,
		resolve: { ProfileResolverService }
	}
];

@NgModule({
	declarations: [ProfileComponent, SkillsComponent, PortfolioComponent, KeywordsComponent, DescriptionComponent, SelectionComponent, LicenseComponent, AvailabilityComponent, LocationComponent, RemoveLeadingZeroPipe, ProfileImageComponent, AttachmentComponent, NameTrimPipe, SelectFromCloudComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		PartialsModule,
		MatSnackBarModule,
		MatTooltipModule,
		TextFieldModule,
		ClickOutsideModule,
		MatIconModule,
		NgbTimepickerModule,
		MatDatepickerModule,
		GooglePlaceModule,
		PerfectScrollbarModule,
		NgxDropzoneModule,
		MatSliderModule,
		MatProgressBarModule,
		NgxCurrencyModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		TranslateModule.forChild()
	],
	providers: [
		{
			provide: PERFECT_SCROLLBAR_CONFIG,
			useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
		}
	]
})
export class ProfileModule {
}
