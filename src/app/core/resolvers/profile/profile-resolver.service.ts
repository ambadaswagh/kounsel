import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Subject, zip } from 'rxjs';
import { parallel } from 'async';
import { ProfileService } from '../../services/profile/profile.service';
import { map } from 'rxjs/operators';
import { ProfileModel } from '../../model/profile/profile.model';

@Injectable({
	providedIn: 'root'
})
export class ProfileResolverService implements Resolve<ProfileModel> {

	constructor(private router: Router, private profileService: ProfileService) {
	}

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

		// const observer = new Subject<any>();
		// parallel(
		// 	{
		// 		profileInfo: (profileInfo) => {
		// 			this.profileService.getProfile().subscribe((data) => {
		// 				profileInfo(null, data.data);
		// 			}, (error) => {
		// 				profileInfo(error, null);
		// 			});
		// 		},
		// 	},
		// 	(err: string, results: any) => {
		// 		if (err && err.indexOf('401 OK') !== -1) {
		// 			this.router.navigate(['pages/login']).then();
		// 			observer.next(results);
		// 			observer.complete();
		// 		}
		// 		observer.next(results);
		// 		observer.complete();
		// 	});
		// return observer.asObservable();

		const profileData = this.profileService.getProfile();
		const availability = this.profileService.getAvailability();
		return zip(profileData, availability).pipe(
			map(data => {
				const [profileInfo, availability] = data.map(item => item['data']);
				const completed = [];
				const incomplete = [];

				if (this.isBasicProfileComplete(profileInfo)) completed.push('basic-profile');
				else incomplete.push('basic-profile');

				if (this.isProfileImageComplete(profileInfo)) completed.push('image-profile');
				else incomplete.push('image-profile');

				if (this.isLocationComplete(profileInfo)) completed.push('location');
				else incomplete.push('location')

				if (this.isAvailabilityComplete(availability)) completed.push('availability');
				else incomplete.push('availability');

				if (this.isSkillCompleted(profileInfo)) completed.push('skills');
				else incomplete.push('skills');

				if (this.isPortfolioComplete(profileInfo)) completed.push('portfolio');
				else incomplete.push('portfolio');

				if (this.isAttachmentCompleted(profileInfo.attachment)) completed.push('attachment');
				else incomplete.push('attachment')

				if( this.isKeywordsCompleted(profileInfo) ) completed.push('keywords');
				else incomplete.push('keywords');

				if( this.isDescriptionCompleted(profileInfo) ) completed.push('description');
				else incomplete.push('description');

				if (profileInfo.license.length) completed.push('license');
				else incomplete.push('license');

				profileInfo['completed'] = completed;
				profileInfo['incomplete'] = incomplete;
				return profileInfo;
			})
		)
	}

	isBasicProfileComplete(profileInfo: ProfileModel) {
		if (!profileInfo.profile) return false;
		return profileInfo.profile.name && profileInfo.profile.profession && profileInfo.profile.category && profileInfo.profile.language && profileInfo.profile.rate;
	}

	isLocationComplete(profileInfo: ProfileModel) {
		if (!profileInfo.profile) return false;
		return profileInfo.profile.city && profileInfo.profile.country && profileInfo.profile.state;
	}

	isAvailabilityComplete(availability) {
		if (!availability.day) return false;
		return availability.day.length > 0;
	}

	isSkillCompleted(profileInfo: ProfileModel) {
		if (!profileInfo.profile) return false;
		return profileInfo.profile.skills ? profileInfo.profile.skills.length > 0 : false;
	}

	isPortfolioComplete(profileInfo: ProfileModel) {
		if (!profileInfo.profile) return false;
		for (let key of ['behance', 'medium', 'dribble', 'linkedin', 'stackoverflow', 'yelp', 'web']) {
			if (profileInfo.profile[key]) {
				return true;
			}
		}
		return false;
	}

	isAttachmentCompleted(attachments) {
		return attachments.length > 0;
	}

	isProfileImageComplete(profileInfo: ProfileModel) {
		if (!profileInfo.cover) return false;
		return true
	}

	isKeywordsCompleted(profileInfo: ProfileModel){
		if( !profileInfo.profile ) return false;
		return profileInfo.profile.keywords;
	}

	isDescriptionCompleted(profileInfo: ProfileModel){
		if( !profileInfo.profile ) return false;
		return profileInfo.profile.description;
	}
}
