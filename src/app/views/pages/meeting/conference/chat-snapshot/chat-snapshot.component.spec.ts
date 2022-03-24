import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatSnapshotComponent } from './chat-snapshot.component';

describe('ChatSnapshotComponent', () => {
  let component: ChatSnapshotComponent;
  let fixture: ComponentFixture<ChatSnapshotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatSnapshotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatSnapshotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
