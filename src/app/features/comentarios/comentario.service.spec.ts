import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ComentarioService } from './comentario.service';
import { environment } from '../../../environments/environment';
import { Comentario, CreateComentarioDto } from '../../core/models/comentario.model';

fdescribe('ComentarioService', () => {
  let service: ComentarioService;
  let httpMock: HttpTestingController;

  // URL base esperada
  const apiUrl = `${environment.apiUrl}/Comentarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComentarioService]
    });

    service = TestBed.inject(ComentarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  // --- Teste: GET (Buscar com Query Params) ---
  it('deve buscar comentários por ID da obra (GET com params)', () => {
    const obraId = 'obra-123';
    const dummyComments: Comentario[] = [
      { 
        id: '1', 
        conteudo: 'Gostei', 
        dataComentario: new Date(), 
        autorUsername: 'User1', 
        obraDeArteId: obraId, 
        urlFotoPerfil: '' 
      },
      { 
        id: '2', 
        conteudo: 'Legal', 
        dataComentario: new Date(), 
        autorUsername: 'User2', 
        obraDeArteId: obraId, 
        urlFotoPerfil: '' 
      }
    ];

    service.getComentarios(obraId).subscribe(comments => {
      expect(comments.length).toBe(2);
      expect(comments).toEqual(dummyComments);
    });

    // Verifica a requisição.
    // Importante: Como usa HttpParams, a URL completa inclui a query string.
    // Podemos checar a URL base e os params separadamente para ser mais preciso.
    const req = httpMock.expectOne(request => 
      request.url === apiUrl && request.params.has('obraDeArteId')
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('obraDeArteId')).toBe(obraId);

    req.flush(dummyComments);
  });

  // --- Teste: POST (Criar) ---
  it('deve criar um comentário (POST)', () => {
    const newCommentDto: CreateComentarioDto = { 
      obraDeArteId: 'obra-123', 
      conteudo: 'Comentário novo' 
    };
    
    const responseComment: Comentario = { 
      id: '99', 
      ...newCommentDto, 
      dataComentario: new Date(), 
      autorUsername: 'Eu', 
      urlFotoPerfil: '' 
    };

    service.criarComentario(newCommentDto).subscribe(comment => {
      expect(comment).toEqual(responseComment);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCommentDto);

    req.flush(responseComment);
  });

  // --- Teste: DELETE (Remover) ---
  it('deve deletar um comentário por ID (DELETE)', () => {
    const commentId = 'comentario-999';

    service.deletarComentario(commentId).subscribe(response => {
      expect(response).toBeNull();
    });

    // Verifica se a URL foi montada corretamente com o ID
    const req = httpMock.expectOne(`${apiUrl}/${commentId}`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
  });

  // --- Teste: Erro ---
  it('deve propagar erro da API', () => {
    service.getComentarios('1').subscribe({
      next: () => fail('Deveria ter falhado'),
      error: (error) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(req => req.url === apiUrl);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});