import { TestBed } from '@angular/core/testing';

import { PhysioService } from './physio.service';

describe('PhysioService', () => {
  let service: PhysioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhysioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
