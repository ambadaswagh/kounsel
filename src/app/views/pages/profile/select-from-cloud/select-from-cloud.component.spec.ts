import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFromCloudComponent } from './select-from-cloud.component';

describe('SelectFromCloudComponent', () => {
  let component: SelectFromCloudComponent;
  let fixture: ComponentFixture<SelectFromCloudComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectFromCloudComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFromCloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
