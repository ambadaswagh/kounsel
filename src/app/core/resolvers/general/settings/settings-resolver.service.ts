import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SettingsService } from '../../../services/general/settings/settings.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsResolverService implements Resolve<any> {

  constructor(private settingService: SettingsService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.settingService.getSettings();
  }
}
