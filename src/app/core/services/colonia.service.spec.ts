import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ColoniaService } from './colonia.service';
import { environment } from '../../../environments/environment';

describe('ColoniaService', () => {
  let service: ColoniaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ColoniaService],
    });
    service = TestBed.inject(ColoniaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch colonias of Dolores Hidalgo', () => {
    const mockData = [
      { id: '1', name: 'Centro', zoneType: 'URBANA', isActive: true },
      { id: '2', name: 'Lindavista', zoneType: 'URBANA', isActive: true },
    ];

    service.getAll().subscribe((colonias) => {
      expect(colonias.length).toBe(2);
      expect(colonias[0].name).toBe('Centro');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/colonias`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockData });
  });
});
