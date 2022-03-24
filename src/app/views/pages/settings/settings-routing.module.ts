import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsComponent } from './settings.component';
import { SettingsResolverService } from '../../../core/resolvers/general/settings/settings-resolver.service'

const routes: Routes = [{ path: '', component: SettingsComponent, resolve: { response: SettingsResolverService } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
