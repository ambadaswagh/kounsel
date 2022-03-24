import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchVisibilityComponent } from './search-visibility.component';

describe('SearchVisibilityComponent', () => {
  let component: SearchVisibilityComponent;
  let fixture: ComponentFixture<SearchVisibilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchVisibilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchVisibilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
