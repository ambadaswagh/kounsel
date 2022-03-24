// Angular
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthService } from '../../../../core/auth';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { ActionNotificationComponent } from '../../../partials/content/crud';

@Component({
	selector: 'kt-forgot-password',
	templateUrl: './forgot-password.component.html',
	styleUrls: ['./forgot-password.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class ForgotPasswordComponent implements OnInit {

	passwordResetForm = new FormGroup({
		email: new FormControl('', [Validators.required, Validators.email])
	})

	constructor(private authService: AuthService, private _snackBar: MatSnackBar, private router: Router) { }

	ngOnInit() { }

	async submit() {
		try {
			await this.authService.resetPassword(this.passwordResetForm.get('email').value);
			this.openSnackBar("Password reset link has been sent to your email", {success: true});
			this.router.navigate(['auth', 'login']);
		} catch (error) {
			this.openSnackBar("Something went wrong, please try again", {error: true});
		}
	}

	openSnackBar(text, meta) {
		this._snackBar.openFromComponent(ActionNotificationComponent, {
			data:{
				message: text, ...meta
			},
			duration: 5000,
			horizontalPosition: 'right',
			panelClass: 'customSnackBarBackground'
		})
	}
}
