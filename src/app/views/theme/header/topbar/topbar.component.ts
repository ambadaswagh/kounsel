// Angular
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { LayoutConfigService } from '../../../../core/_base/layout';

@Component({
	selector: 'kt-topbar',
	templateUrl: './topbar.component.html',
	styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit, AfterViewInit {
	// Public properties
	topBarConfig: {
		search?: {},

	} = {};

	/**
	 * Component constructor
	 *
	 * @param layoutConfigService: LayoutConfigService
	 */
	constructor(private layoutConfigService: LayoutConfigService) {

	}

	/**
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
	 */

	/**
	 * On init
	 */
	ngOnInit(): void {
		this.topBarConfig =  this.layoutConfigService.getConfig('header.topbar');
	}

	/**
	 * On after view init
	 */
	ngAfterViewInit(): void {
	}
}
