import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { API_URL } from '@wbpwa/auth/data-access';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: API_URL, useValue: 'http://test-api.example.com' }
      ],
    }).compileComponents();
  });

  it('should create the shell component', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
