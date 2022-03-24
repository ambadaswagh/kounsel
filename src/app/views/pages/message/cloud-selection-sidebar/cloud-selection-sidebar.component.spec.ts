import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudSelectionSidebarComponent } from './cloud-selection-sidebar.component';

describe('CloudSelectionSidebarComponent', () => {
  let component: CloudSelectionSidebarComponent;
  let fixture: ComponentFixture<CloudSelectionSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudSelectionSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudSelectionSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
