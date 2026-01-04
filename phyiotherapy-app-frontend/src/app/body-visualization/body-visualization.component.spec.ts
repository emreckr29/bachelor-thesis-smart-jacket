import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BodyVisualizationComponent } from './body-visualization.component';

describe('BodyVisualizationComponent', () => {
  let component: BodyVisualizationComponent;
  let fixture: ComponentFixture<BodyVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BodyVisualizationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BodyVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
