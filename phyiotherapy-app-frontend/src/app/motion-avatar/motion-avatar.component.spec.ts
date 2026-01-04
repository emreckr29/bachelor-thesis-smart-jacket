import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionAvatarComponent } from './motion-avatar.component';

describe('MotionAvatarComponent', () => {
  let component: MotionAvatarComponent;
  let fixture: ComponentFixture<MotionAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotionAvatarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MotionAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
