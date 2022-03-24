import { TestBed } from '@angular/core/testing';

import { FireBaseUserService } from './fire-base-user.service';

describe('FireBaseUserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FireBaseUserService = TestBed.get(FireBaseUserService);
    expect(service).toBeTruthy();
  });
});
