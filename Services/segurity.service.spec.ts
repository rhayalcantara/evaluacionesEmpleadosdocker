import { TestBed } from '@angular/core/testing';

import { SegurityService } from './segurity.service';

describe('SegurityService', () => {
  let service: SegurityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SegurityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
