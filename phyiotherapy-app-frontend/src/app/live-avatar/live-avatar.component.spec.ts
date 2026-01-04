import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveAvatarComponent } from './live-avatar.component';

describe('LiveAvatarComponent', () => {
  let component: LiveAvatarComponent;
  let fixture: ComponentFixture<LiveAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveAvatarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LiveAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
