import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AllyService } from './ally.service';
import { environment } from '../../../environments/environment';

describe('AllyService', () => {
  let service: AllyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AllyService],
    });
    service = TestBed.inject(AllyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all commercial allies', () => {
    const mockAllies = [
      {
        id: '1',
        businessName: 'Veterinaria Dolores',
        category: 'VETERINARIA',
        phone: '4181234567',
        address: 'Centro #10',
        hasPromotionForAdopters: true,
        isVerified: true,
        isActive: true,
      },
    ];

    service.getAll().subscribe((allies) => {
      expect(allies.length).toBe(1);
      expect(allies[0].businessName).toBe('Veterinaria Dolores');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/allies`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockAllies });
  });
});
