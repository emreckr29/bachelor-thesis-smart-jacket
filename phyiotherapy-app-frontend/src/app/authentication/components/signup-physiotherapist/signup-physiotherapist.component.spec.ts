import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupPhysiotherapistComponent } from './signup-physiotherapist.component';

describe('SignupPhysiotherapistComponent', () => {
  let component: SignupPhysiotherapistComponent;
  let fixture: ComponentFixture<SignupPhysiotherapistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupPhysiotherapistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignupPhysiotherapistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
