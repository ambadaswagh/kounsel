import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConferenceControlPanelComponent } from './conference-control-panel.component';

describe('ConferenceControlPanelComponent', () => {
  let component: ConferenceControlPanelComponent;
  let fixture: ComponentFixture<ConferenceControlPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConferenceControlPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConferenceControlPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
