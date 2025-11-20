import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CurtidaService } from './curtida.service';
import { environment } from '../../../environments/environment';
import { CurtidaResponseDto } from '../../core/models/curtida.model';

fdescribe('CurtidaService', () => {
  let service: CurtidaService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/Curtidas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CurtidaService]
    });

    service = TestBed.inject(CurtidaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a like request (POST)', () => {
    const obraId = 'art-123';
    
    const mockResponse: CurtidaResponseDto = {
      curtiu: true,
      totalCurtidas: 15
    };

    service.curtir(obraId).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.curtiu).toBeTrue();
      expect(response.totalCurtidas).toBe(15);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    
    expect(req.request.body).toEqual({ obraDeArteId: obraId });

    req.flush(mockResponse);
  });

  it('should send a remove like request (DELETE)', () => {
    const obraId = 'art-456';

    const mockResponse: CurtidaResponseDto = {
      curtiu: false,
      totalCurtidas: 14
    };

    service.descurtir(obraId).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.curtiu).toBeFalse();
    });

    const req = httpMock.expectOne(`${apiUrl}/${obraId}`);
    expect(req.request.method).toBe('DELETE');

    req.flush(mockResponse);
  });

  it('should handle API errors', () => {
    const obraId = 'art-error';

    service.curtir(obraId).subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
  });
});