import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../../../core/auth/_services/auth.service';
import { AccountService } from '../../../../core/services/general/account/account.service';
import { Router } from '@angular/router';
declare var $: any;

export const matchingInputsValidator: ValidatorFn = (control: FormGroup) => {
	let pass = control.get('password').value;
	let confirmPass = control.get('confirmPassword').value;
	if (pass != confirmPass) {
		return { passwordMisMatch: true }
	}
	return null;
}

@Component({
	selector: 'kt-register',
	templateUrl: './register.component.html',
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {

	showPassword = false;
	showConfirmPassword = false;
	signUpError = '';
	successMessage = false;
	loading = false;
	UID;
	TOKEN;

	registerForm: FormGroup = new FormGroup({
		firstName: new FormControl(null, [Validators.required]),
		email: new FormControl(null, [Validators.required, Validators.email]),
		password: new FormControl(null, [Validators.required, Validators.minLength(6)]),
		confirmPassword: new FormControl(null, [Validators.required])
	}, { validators: [matchingInputsValidator] })

	constructor(
		private authService: AuthService,
		private accountService: AccountService,
		private router: Router,
		private cdr: ChangeDetectorRef) { }

	ngOnInit() {
	}

	ngOnDestroy() { }

	async submit() {
		try {
			this.loading = true;
			this.signUpError = '';
			this.successMessage = false;

			const name = this.registerForm.get('firstName').value;
			const email = this.registerForm.get('email').value;
			const password = this.registerForm.get('password').value;

			const response = await this.authService.doRegister(email, password);
			const TOKEN = await response.user.getIdToken();
			const UID = response.user.uid;
			this.TOKEN = TOKEN;
			this.UID = UID;

			try {
				const _response = await this.accountService.postAccount(name, UID, TOKEN).toPromise();

				if (!(_response['code'] == 200 || _response['code'] == 201)) {
					await response.user.delete();
					throw new Error('Something went wrong please try again');
				}

			} catch (error) {
				await response.user.delete();
				throw new Error('Something went wrong please try again');
			}
			
			await response.user.sendEmailVerification({
				url: window.location.origin
			});

			this.successMessage = true;
			this.registerForm.reset();
			this.openTermsCondition();
		} catch (error) {
			console.error(error);
			this.loading = false;
			this.signUpError = error.message;
		}
		finally {
			this.loading = false;
			this.cdr.detectChanges();
		}
	}

	async googleSignUp() {
		try {
			this.registerForm.reset();
			this.loading = true;
			this.signUpError = '';
			this.successMessage = false;
			const response = await this.authService.doGoogleLoginAsync();

			if (!response.additionalUserInfo.isNewUser) {
				throw new Error('This gmail id is already in use by another account.');
			}
			else {
				const TOKEN = await response.user.getIdToken();
				const UID = response.user.uid;
				const name = response.user.displayName;
				this.TOKEN = TOKEN;
				this.UID = UID;
				
				try {
					const _response = await this.accountService.postAccount(name, UID, TOKEN).toPromise();

					if (!(_response['code'] == 200 || _response['code'] == 201)) {
						response.user.delete();
						throw new Error('Something went wrong please try again');
					}

				} catch (error) {
					await response.user.delete();
					throw new Error('Something went wrong please try again');
				}

				
				await response.user.sendEmailVerification({
					url: window.location.origin
				});
				this.successMessage = true;
				this.openTermsCondition();
			}
		} catch (error) {
			console.error(error);
			this.loading = false;
			this.signUpError = error.message;
		}
		finally {
			this.loading = false;
			this.cdr.detectChanges();
		}
	}

	openTermsCondition() {
		$('#registerTermCondition').modal({
			backdrop: 'static',
			keyboard: false
		})
		$("#registerTermCondition").modal('show');
		this.cdr.detectChanges();
	}

	closeTermCondition(_event) {
		$("#registerTermCondition").modal('hide');
		if (_event) {
			this.acceptedTerms();
		}
		else {
			this.rejectedTerms();
		}
		this.cdr.detectChanges();
	}

	async acceptedTerms() {
		try {
			const response = await this.accountService.signUpAcceptAgreement(this.UID, this.TOKEN, {
				account: {
					legal_user_agreement: 10,
					legal_privacy_policy: 10,
					legal_escrow_agreement: 10,
					legal_confidentiality_agreement: 10,
					legal_ach_fees_agreement: 10
				}
			}).toPromise();
		} catch (error) {
			console.error(error);
		}
		finally {
			this.loading = false;
			this.cdr.detectChanges();
			this.router.navigate(['dashboard']);
		}
	}

	rejectedTerms() {
		this.loading = false;
		this.cdr.detectChanges();
		this.router.navigate(['dashboard']);
	}
}
