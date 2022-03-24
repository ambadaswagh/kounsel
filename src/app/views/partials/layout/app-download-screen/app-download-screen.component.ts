import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
	selector: 'kt-app-download-screen',
	templateUrl: './app-download-screen.component.html',
	styleUrls: ['./app-download-screen.component.scss']
})
export class AppDownloadScreenComponent implements OnInit {
	@Input() osType = '';
	@Output() closeGetApp: EventEmitter<string> = new EventEmitter<string>();
	public deviceData: { [key: string]: { appStoreImage: string; appStoreUrl: string; } } = {
		Android: {
			appStoreImage: './assets/media/icons/svg/GetAppScreen/get-on-google-pay.svg',
			appStoreUrl: 'https://play.google.com/store/apps/details?id=co.mirach.kounsel.android'
		},
		iOS: {
			appStoreImage: './assets/media/icons/svg/GetAppScreen/download-app-store.svg',
			appStoreUrl: 'https://apps.apple.com/us/app/kounsel/id1371021887'
		},
	};

	constructor() {
	}

	ngOnInit() {
	}

	closeScreen(): void {
		this.osType = '';
		this.closeGetApp.emit();
	}
}
