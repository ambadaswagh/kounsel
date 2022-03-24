// Angular
import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material';
// RxJS
import { delay } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
	selector: 'kt-action-natification',
	templateUrl: './action-notification.component.html',
	changeDetection: ChangeDetectionStrategy.Default

})
export class ActionNotificationComponent implements OnInit {
	/**
	 * Component constructor
	 *
	 * @param data: any
	 */
	constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any, public snackBar: MatSnackBar) { }

	ngOnInit() {
	}
	
  	public onDismiss() {
		this.snackBar.dismiss()
	}
}
