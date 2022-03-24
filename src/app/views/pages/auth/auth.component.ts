// Angular
import { Component, ElementRef, OnInit, Renderer2, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
// Layout
import { LayoutConfigService, SplashScreenService, TranslationService } from '../../../core/_base/layout';
// Auth
import { AuthNoticeService } from '../../../core/auth';
import * as _ from 'lodash';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Component({
	selector: 'kt-auth',
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class AuthComponent implements OnInit {
	today: number = Date.now();
	headerLogo: string;
	images = [
		{
			url: 'assets/media/login_images/image.png',
			url2x: 'assets/media/login_images/image@2x.png',
			url3x: 'assets/media/login_images/image@3x.png',
			urlTablet: 'assets/media/login_images/imageTablet.png',
			urlTablet2x: 'assets/media/login_images/imageTablet@2x.png',
			urlTablet3x: 'assets/media/login_images/imageTablet@3x.png',
			urlMob: 'assets/media/login_images/imageMob.png',
			urlMob2x: 'assets/media/login_images/imageMob@2x.png',
			urlMob3x: 'assets/media/login_images/imageMob@3x.png',
			type: 1,
			highQuality: false
		},
		{
			url: 'assets/media/login_images/image.png',
			url2x: 'assets/media/login_images/image@2x.png',
			url3x: 'assets/media/login_images/image@3x.png',
			urlTablet: 'assets/media/login_images/imageTablet.png',
			urlTablet2x: 'assets/media/login_images/imageTablet@2x.png',
			urlTablet3x: 'assets/media/login_images/imageTablet@3x.png',
			urlMob: 'assets/media/login_images/imageMob.png',
			urlMob2x: 'assets/media/login_images/imageMob@2x.png',
			urlMob3x: 'assets/media/login_images/imageMob@3x.png',
			type: 1,
			highQuality: false
		},
		{
			url: 'assets/media/login_images/image.png',
			url2x: 'assets/media/login_images/image@2x.png',
			url3x: 'assets/media/login_images/image@3x.png',
			urlTablet: 'assets/media/login_images/imageTablet.png',
			urlTablet2x: 'assets/media/login_images/imageTablet@2x.png',
			urlTablet3x: 'assets/media/login_images/imageTablet@3x.png',
			urlMob: 'assets/media/login_images/imageMob.png',
			urlMob2x: 'assets/media/login_images/imageMob@2x.png',
			urlMob3x: 'assets/media/login_images/imageMob@3x.png',
			type: 1,
			highQuality: false
		},
		{
			url: 'assets/media/login_images/loginTabletHorizontalSecond.jpg',
			url2x: 'assets/media/login_images/loginTabletHorizontalSecond@2x.jpg',
			url3x: 'assets/media/login_images/loginTabletHorizontalSecond@3x.jpg',
			urlTablet: 'assets/media/login_images/loginTabletVerticalThird.jpg',
			urlTablet2x: 'assets/media/login_images/loginTabletVerticalThird@2x.jpg',
			urlTablet3x: 'assets/media/login_images/loginTabletVerticalThird@3x.jpg',
			urlMob: 'assets/media/login_images/imageMob.png',
			urlMob2x: 'assets/media/login_images/imageMob@2x.png',
			urlMob3x: 'assets/media/login_images/imageMob@3x.png',
			type: 2,
			highQuality: false
		},
		{
			url: 'assets/media/login_images/loginTabletHorizontalThird.jpg',
			url2x: 'assets/media/login_images/loginTabletHorizontalThird@2x.jpg',
			url3x: 'assets/media/login_images/loginTabletHorizontalThird@3x.jpg',
			urlTablet: 'assets/media/login_images/loginTabletVerticalThird.jpg',
			urlTablet2x: 'assets/media/login_images/loginTabletVerticalThird@2x.jpg',
			urlTablet3x: 'assets/media/login_images/loginTabletVerticalThird@3x.jpg',
			urlMob: 'assets/media/login_images/imageMob.png',
			urlMob2x: 'assets/media/login_images/imageMob@2x.png',
			urlMob3x: 'assets/media/login_images/imageMob@3x.png',
			type: 2,
			highQuality: false
		},
	];

	imageToDisplay;
	innerWidth = window.innerWidth;
	widthChange : Subscription;

	// @HostListener('window:resize', ['$event'])
	// onResize(event) {
	// 	this.innerWidth = window.innerWidth;
	// }

	/**
	 * Component constructor
	 *
	 * @param el
	 * @param render
	 * @param layoutConfigService: LayoutConfigService
	 * @param authNoticeService: authNoticeService
	 * @param translationService: TranslationService
	 * @param splashScreenService: SplashScreenService
	 */
	constructor(
		private el: ElementRef,
		private render: Renderer2,
		private layoutConfigService: LayoutConfigService,
		public authNoticeService: AuthNoticeService,
		private translationService: TranslationService,
		private splashScreenService: SplashScreenService,
		private cdr: ChangeDetectorRef) {

		this.innerWidth = window.innerWidth;
		this.imageToDisplay = this.getRandomImage();
		this.lazyLoadHighQualityImages();
	}

	/**
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
	 */

	/**
	 * On init
	 */
	ngOnInit(): void {
		this.innerWidth = window.innerWidth;
		// this.imageToDisplay = this.getRandomImage();
		this.translationService.setLanguage(this.translationService.getSelectedLanguage());
		this.headerLogo = this.layoutConfigService.getLogo();

		this.splashScreenService.hide();
		
		this.widthChange = fromEvent(window, 'resize').pipe(throttleTime(300)).subscribe(
			ev => {
				console.log(ev)
				this.innerWidth = window.innerWidth;
				this.cdr.detectChanges();
			}
		)
	}

	/**
	 * Load CSS for this specific page only, and destroy when navigate away
	 * @param styleUrl
	 */
	private loadCSS(styleUrl: string) {
		return new Promise((resolve, reject) => {
			const styleElement = document.createElement('link');
			styleElement.href = styleUrl;
			styleElement.type = 'text/css';
			styleElement.rel = 'stylesheet';
			styleElement.onload = resolve;
			this.render.appendChild(this.el.nativeElement, styleElement);
		});
	}

	getRandomImage() {
		let idx = _.random(0, 4);
		return this.images[idx];
	}

	async lazyLoadHighQualityImages() {
		try {

			if (innerWidth > 924) {
				const url2x = await this.onLoadPromise(this.imageToDisplay.url2x);
				this.imageToDisplay.url = url2x;
				this.imageToDisplay.highQuality = true;
				this.cdr.detectChanges();

				const url3x = await this.onLoadPromise(this.imageToDisplay.url3x);
				this.imageToDisplay.url = url3x;
				console.log(url3x)
				this.cdr.detectChanges();
			}
			else if (innerWidth > 500 && innerWidth < 925) {
				const urlTablet2x = await this.onLoadPromise(this.imageToDisplay.urlTablet2x);
				this.imageToDisplay.urlTablet = urlTablet2x;
				this.imageToDisplay.highQuality = true;
				this.cdr.detectChanges();

				const urlTablet3x = await this.onLoadPromise(this.imageToDisplay.urlTablet3x);
				this.imageToDisplay.urlTablet = urlTablet3x;
				this.cdr.detectChanges()
			}
			else {
				const urlMob2x = await this.onLoadPromise(this.imageToDisplay.urlMob2x);
				this.imageToDisplay.urlMob = urlMob2x;
				this.imageToDisplay.highQuality = true;
				this.cdr.detectChanges();

				const urlMob3x = await this.onLoadPromise(this.imageToDisplay.urlMob3x);
				this.imageToDisplay.urlMob = urlMob3x;
			}

			this.cdr.detectChanges();
		} catch (error) {
			console.log(error)
		}

	}

	async onLoadPromise(url) {
		try {
			const imageElem = document.createElement('img');
			imageElem.src = url;
			const toSetSrc = await new Promise((resolve, reject) => {
				imageElem.onload = function () {
					resolve(this['src']);
				}

				imageElem.onerror = function () {
					reject('Some error happened while loading ' + url);
				}
			})
			imageElem.remove();
			return toSetSrc;
		} catch (error) {
			throw error;
		}
	}

	ngOnDestroy(){
		if( this.widthChange ){
			this.widthChange.unsubscribe();
		}
	}
}
