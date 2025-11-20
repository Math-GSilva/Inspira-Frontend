import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CategoriaService } from './categoria.service';
import { environment } from '../../../environments/environment';
import { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../../core/models/categoria.model';

fdescribe('CategoriaService', () => {
  let service: CategoriaService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/Categorias`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoriaService]
    });

    service = TestBed.inject(CategoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve all categories (GET)', () => {
    const dummyCategories: Categoria[] = [
      { id: '1', nome: 'Pintura', descricao: 'Tintas e telas' },
      { id: '2', nome: 'Escultura', descricao: 'Argila e pedra' }
    ];

    service.getCategories().subscribe(categories => {
      expect(categories.length).toBe(2);
      expect(categories).toEqual(dummyCategories);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');

    req.flush(dummyCategories);
  });

  it('should retrieve a category by ID (GET)', () => {
    const dummyCategory: Categoria = { id: '1', nome: 'Pintura', descricao: 'Detalhes' };

    service.getCategoryById('1').subscribe(category => {
      expect(category).toEqual(dummyCategory);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');

    req.flush(dummyCategory);
  });

  it('should create a category (POST)', () => {
    const newCategoryDto: CreateCategoriaDto = { nome: 'Digital', descricao: 'Arte digital' };
    const responseCategory: Categoria = { id: '123', ...newCategoryDto };

    service.createCategory(newCategoryDto).subscribe(category => {
      expect(category).toEqual(responseCategory);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCategoryDto);

    req.flush(responseCategory);
  });

  it('should update a category (PUT)', () => {
    const updateDto: UpdateCategoriaDto = { nome: 'Pintura a Óleo' };
    const updatedCategory: Categoria = { id: '1', nome: 'Pintura a Óleo', descricao: 'Atualizado' };

    service.updateCategory('1', updateDto).subscribe(category => {
      expect(category).toEqual(updatedCategory);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);

    req.flush(updatedCategory);
  });

  it('should delete a category (DELETE)', () => {
    service.deleteCategory('1').subscribe(response => {
      expect(response).toBeNull(); 
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
  });

  it('should handle API error gracefully', () => {
    const errorMessage = 'Erro ao buscar categorias';

    service.getCategories().subscribe({
      next: () => fail('Deveria ter falhado'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Server Error');
      }
    });

    const req = httpMock.expectOne(apiUrl);
    
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });
});