import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AppDownloadScreenComponent} from './app-download-screen.component';

describe('AppDownloadScreenComponent', () => {
    let component: AppDownloadScreenComponent;
    let fixture: ComponentFixture<AppDownloadScreenComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AppDownloadScreenComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AppDownloadScreenComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
