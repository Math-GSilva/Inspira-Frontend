import { TestBed } from '@angular/core/testing';
import { PostStateService } from './post-state.service';
import { ObraDeArte } from '../../core/models/obra-de-arte.model';

fdescribe('PostStateService', () => {
  let service: PostStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PostStateService]
    });
    service = TestBed.inject(PostStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit a new post to subscribers when announceNewPost is called', (done) => {
    const dummyPost: ObraDeArte = {
      id: '123',
      titulo: 'Teste Post',
      descricao: 'Desc',
      url: 'img.jpg',
      autorUsername: 'user',
      dataPublicacao: new Date().toISOString(),
      totalCurtidas: 0,
      urlFotoPerfilAutor: '',
      categoriaNome: 'Geral'
    };

    // 1. Inscreva-se no Observable
    service.newPost$.subscribe((post) => {
      // 3. Verifique se o que chegou é igual ao que foi enviado
      expect(post).toEqual(dummyPost);
      done(); // Avisa ao Jasmine que o teste assíncrono acabou
    });

    // 2. Dispare o evento
    service.announceNewPost(dummyPost);
  });
});