import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingMethodComponent } from './billing-method.component';

describe('BillingMethodComponent', () => {
  let component: BillingMethodComponent;
  let fixture: ComponentFixture<BillingMethodComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BillingMethodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BillingMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
