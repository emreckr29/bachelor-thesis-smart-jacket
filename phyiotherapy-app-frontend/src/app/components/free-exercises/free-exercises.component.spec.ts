import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeExercisesComponent } from './free-exercises.component';

describe('FreeExercisesComponent', () => {
  let component: FreeExercisesComponent;
  let fixture: ComponentFixture<FreeExercisesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeExercisesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FreeExercisesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
