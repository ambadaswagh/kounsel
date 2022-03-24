import { TestBed } from '@angular/core/testing';

import { AWSService } from './AWS.service';

describe('S3BucketService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AWSService = TestBed.get(AWSService);
    expect(service).toBeTruthy();
  });
});
