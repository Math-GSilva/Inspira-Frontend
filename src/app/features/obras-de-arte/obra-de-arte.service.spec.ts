import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ObraDeArteService } from './obra-de-arte.service';
import { environment } from '../../../environments/environment';
import { ObraDeArte, UpdateObraDeArteDto } from '../../core/models/obra-de-arte.model';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

describe('ObraDeArteService', () => {
  let service: ObraDeArteService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/ObrasDeArte`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ObraDeArteService]
    });

    service = TestBed.inject(ObraDeArteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an artwork (POST FormData)', () => {
    const formData = new FormData();
    formData.append('Titulo', 'Nova Arte');
    
    const mockResponse: ObraDeArte = { id: '1', titulo: 'Nova Arte' } as ObraDeArte;

    service.createObra(formData).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);

    req.flush(mockResponse);
  });

  describe('getAll', () => {
    
    it('should get artworks with default parameters', () => {
      service.getAll().subscribe();

      // Verifica a URL base
      const req = httpMock.expectOne(req => req.url === apiUrl);
      expect(req.request.method).toBe('GET');
      
      expect(req.request.params.get('pageSize')).toBe('10');
      expect(req.request.params.has('categoriaId')).toBeFalse();
      expect(req.request.params.has('cursor')).toBeFalse();

      req.flush({});
    });

    it('should include filters in query params', () => {
      const categoryId = 'cat-1';
      const cursor = '2023-01-01T00:00:00';
      const pageSize = 20;
      
      service.getAll(categoryId, 'user-ignorado', cursor, pageSize).subscribe();

      const req = httpMock.expectOne(req => req.url === apiUrl);
      
      expect(req.request.params.get('pageSize')).toBe('20');
      expect(req.request.params.get('categoriaId')).toBe(categoryId);
      expect(req.request.params.get('cursor')).toBe(cursor);
      
      expect(req.request.params.has('username')).toBeFalse(); 

      const mockResponse: PaginatedResponse<ObraDeArte> = {
        items: [], nextCursor: null, hasMoreItems: false
      };
      req.flush(mockResponse);
    });
  });

  it('should get artworks by user ID', () => {
    const userId = 'user-123';
    const mockList: ObraDeArte[] = [{ id: '1' } as ObraDeArte];

    service.getAllByUser(userId).subscribe(res => {
      expect(res.length).toBe(1);
      expect(res).toEqual(mockList);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
    expect(req.request.method).toBe('GET');

    req.flush(mockList);
  });

  it('should get artwork by ID', () => {
    const id = 'art-1';
    const mockArt = { id: 'art-1', titulo: 'Arte' } as ObraDeArte;

    service.getObraById(id).subscribe(res => {
      expect(res).toEqual(mockArt);
    });

    const req = httpMock.expectOne(`${apiUrl}/${id}`);
    expect(req.request.method).toBe('GET');

    req.flush(mockArt);
  });

  it('should update artwork', () => {
    const id = 'art-1';
    const dto: UpdateObraDeArteDto = { titulo: 'Editado', descricao: 'Desc' };
    const responseArt = { id, ...dto } as ObraDeArte;

    service.updateObra(id, dto).subscribe(res => {
      expect(res).toEqual(responseArt);
    });

    const req = httpMock.expectOne(`${apiUrl}/${id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);

    req.flush(responseArt);
  });

  it('should delete artwork', () => {
    const id = 'art-1';

    service.deleteObra(id).subscribe(res => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/${id}`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
  });
});