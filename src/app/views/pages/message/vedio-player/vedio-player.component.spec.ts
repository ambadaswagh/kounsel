import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VedioPlayerComponent } from './vedio-player.component';

describe('VedioPlayerComponent', () => {
  let component: VedioPlayerComponent;
  let fixture: ComponentFixture<VedioPlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VedioPlayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VedioPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
