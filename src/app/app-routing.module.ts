// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// Components
import { BaseComponent } from './views/theme/base/base.component';
import { ErrorPageComponent } from './views/theme/content/error-page/error-page.component';
// Auth
import { AuthGuard } from './core/auth';
import { FirebaseAuthGuard } from './core/guards/firebase-auth.guard';

const routes: Routes = [
	{ path: 'auth', loadChildren: () => import('app/views/pages/auth/auth.module').then(m => m.AuthModule) },

	{
		path: '',
		component: BaseComponent,
		children: [
			{
				path: 'profile',
				loadChildren: () => import('app/views/pages/profile/profile.module').then(m => m.ProfileModule),
				canActivate: [FirebaseAuthGuard],
			},
			{
				path: 'account',
				loadChildren: () => import('app/views/pages/account/account.module').then(m => m.AccountModule),
				canActivate: [FirebaseAuthGuard],
			},
			{
				path: 'dashboard',
				loadChildren: () => import('app/views/pages/dashboard/dashboard.module').then(m => m.DashboardModule),
				canActivate: [FirebaseAuthGuard],
			},
			// {
			// 	path: 'mail',
			// 	loadChildren: () => import('app/views/pages/apps/mail/mail.module').then(m => m.MailModule),
			// },
			// {
			// 	path: 'ecommerce',
			// 	loadChildren: () => import('app/views/pages/apps/e-commerce/e-commerce.module').then(m => m.ECommerceModule),
			// },
			// {
			// 	path: 'ngbootstrap',
			// 	loadChildren: () => import('app/views/pages/ngbootstrap/ngbootstrap.module').then(m => m.NgbootstrapModule),
			// },
			// {
			// 	path: 'material',
			// 	loadChildren: () => import('app/views/pages/material/material.module').then(m => m.MaterialModule),
			// },
			// {
			// 	path: 'user-management',
			// 	loadChildren: () => import('app/views/pages/user-management/user-management.module').then(m => m.UserManagementModule),
			// },
			// {
			// 	path: 'general',
			// 	loadChildren: () => import('app/views/pages/general/general.module').then(m => m.GeneralModule),
			// },
			// {
			// 	path: 'wizard',
			// 	loadChildren: () => import('app/views/pages/wizard/wizard.module').then(m => m.WizardModule),
			// },
			// {
			// 	path: 'builder',
			// 	loadChildren: () => import('app/views/theme/content/builder/builder.module').then(m => m.BuilderModule),
			// },
			{
				path: 'appointment',
				loadChildren: () => import('./views/pages/appointment/appointment.module').then(m => m.AppointmentModule),
				canActivate: [FirebaseAuthGuard],
			},
			{
				path: 'settings',
				loadChildren: () => import('./views/pages/settings/settings.module').then(m => m.SettingsModule),
				canActivate: [FirebaseAuthGuard],
			},
			{
				path: 'message',
				loadChildren: () => import('./views/pages/message/message.module').then(m => m.MessageModule),
				canActivate: [FirebaseAuthGuard],
			},
			{ 
				path: 'files', 
				loadChildren: () => import('./views/pages/files/files.module').then(m => m.FilesModule),
				canActivate: [FirebaseAuthGuard], 
			},
			{ 
				path: 'meeting', 
				loadChildren: () => import('./views/pages/meeting/meeting.module').then(m => m.MeetingModule), 
			},
			{
				path: 'error/403',
				component: ErrorPageComponent,
				data: {
					type: 'error-v6',
					code: 403,
					title: '403... Access forbidden',
					desc: 'Looks like you don\'t have permission to access for requested page.<br> Please, contact administrator',
				},
			},
			{ path: 'error/:type', component: ErrorPageComponent },
			{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
			{ path: '**', redirectTo: 'dashboard', pathMatch: 'full' },
		],
	},

	{ path: '**', redirectTo: 'error/403', pathMatch: 'full' },
	

];

@NgModule({
	imports: [
		RouterModule.forRoot(routes),
	],
	exports: [RouterModule],
})
export class AppRoutingModule {
}
