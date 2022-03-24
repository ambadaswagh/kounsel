import { TestBed, async, inject } from '@angular/core/testing';

import { FirebaseAuthGuard } from './firebase-auth.guard';

describe('FirebaseAuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FirebaseAuthGuard]
    });
  });

  it('should ...', inject([FirebaseAuthGuard], (guard: FirebaseAuthGuard) => {
    expect(guard).toBeTruthy();
  }));
});
