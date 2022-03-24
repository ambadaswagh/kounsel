import { TestBed } from '@angular/core/testing';

import { SettingsResolverService } from './settings-resolver.service';

describe('SettingsResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SettingsResolverService = TestBed.get(SettingsResolverService);
    expect(service).toBeTruthy();
  });
});
