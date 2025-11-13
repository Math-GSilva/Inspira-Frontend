import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CategoriaService } from './categoria.service';
import { environment } from '../../../environments/environment';
import { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '../../core/models/categoria.model';

fdescribe('CategoriaService', () => {
  let service: CategoriaService;
  let httpMock: HttpTestingController;

  // A URL base que o serviço usa
  const apiUrl = `${environment.apiUrl}/Categorias`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Módulo de teste HTTP
      providers: [CategoriaService]
    });

    service = TestBed.inject(CategoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Garante que não há requisições pendentes ou inesperadas
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Teste: GET (Todas as categorias) ---
  it('should retrieve all categories (GET)', () => {
    const dummyCategories: Categoria[] = [
      { id: '1', nome: 'Pintura', descricao: 'Tintas e telas' },
      { id: '2', nome: 'Escultura', descricao: 'Argila e pedra' }
    ];

    // 1. Chama o método
    service.getCategories().subscribe(categories => {
      expect(categories.length).toBe(2);
      expect(categories).toEqual(dummyCategories);
    });

    // 2. Verifica a URL e o Método
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');

    // 3. Retorna os dados falsos
    req.flush(dummyCategories);
  });

  // --- Teste: GET (Por ID) ---
  it('should retrieve a category by ID (GET)', () => {
    const dummyCategory: Categoria = { id: '1', nome: 'Pintura', descricao: 'Detalhes' };

    service.getCategoryById('1').subscribe(category => {
      expect(category).toEqual(dummyCategory);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');

    req.flush(dummyCategory);
  });

  // --- Teste: POST (Criar) ---
  it('should create a category (POST)', () => {
    const newCategoryDto: CreateCategoriaDto = { nome: 'Digital', descricao: 'Arte digital' };
    const responseCategory: Categoria = { id: '123', ...newCategoryDto };

    service.createCategory(newCategoryDto).subscribe(category => {
      expect(category).toEqual(responseCategory);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCategoryDto); // Verifica se enviou o DTO correto

    req.flush(responseCategory);
  });

  // --- Teste: PUT (Atualizar) ---
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

  // --- Teste: DELETE (Remover) ---
  it('should delete a category (DELETE)', () => {
    service.deleteCategory('1').subscribe(response => {
      // DELETE geralmente não retorna corpo, ou retorna null/void
      expect(response).toBeNull(); 
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null); // Simula resposta vazia (No Content)
  });

  // --- Teste: Tratamento de Erro (Exemplo Genérico) ---
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
    
    // Simula um erro 500
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });
});