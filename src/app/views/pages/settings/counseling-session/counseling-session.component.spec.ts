import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CounselingSessionComponent } from './counseling-session.component';

describe('CounselingSessionComponent', () => {
  let component: CounselingSessionComponent;
  let fixture: ComponentFixture<CounselingSessionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CounselingSessionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CounselingSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
