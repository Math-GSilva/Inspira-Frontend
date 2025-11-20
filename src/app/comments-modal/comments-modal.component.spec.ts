import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReplaySubject } from 'rxjs';
import { CommentsModalComponent } from './comments-modal.component';
import { ComentarioService } from '../features/comentarios/comentario.service';
import { Comentario } from '../core/models/comentario.model';
import { DatePipe } from '@angular/common';

const mockComments: Comentario[] = [
  {
    id: 'c1',
    conteudo: 'Que arte incrível!',
    dataComentario: new Date('2025-01-10T10:30:00Z'),
    autorUsername: 'Autor Um',
    urlFotoPerfil: 'url/foto1.jpg',
    obraDeArteId: 'obra-123'
  },
  {
    id: 'c2',
    conteudo: 'Adorei as cores.',
    dataComentario: new Date('2025-01-11T11:00:00Z'),
    autorUsername: 'Autor Dois',
    urlFotoPerfil: '',
    obraDeArteId: 'obra-123'
  }
];

const mockComentarioService = jasmine.createSpyObj('ComentarioService', ['getComentarios']);
let commentsSubject: ReplaySubject<Comentario[]>;

fdescribe('CommentsModalComponent', () => {
  let component: CommentsModalComponent;
  let fixture: ComponentFixture<CommentsModalComponent>;
  let compiled: HTMLElement;
  const testObraId = 'obra-123';

  beforeEach(async () => {
    commentsSubject = new ReplaySubject<Comentario[]>(1);
    mockComentarioService.getComentarios.and.returnValue(commentsSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [CommentsModalComponent],
      providers: [
        { provide: ComentarioService, useValue: mockComentarioService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommentsModalComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;

    component.obraDeArteId = testObraId;

    fixture.detectChanges(); 
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization and Data Loading', () => {

    it('deve chamar getComentarios com o ID da obra correto na inicialização', () => {
      expect(mockComentarioService.getComentarios).toHaveBeenCalledWith(testObraId);
    });

    it('deve mostrar o estado "carregando" (loading) inicialmente', () => {
      const loadingState = compiled.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();
      expect(loadingState?.textContent).toContain('A carregar comentários...');
      
      expect(compiled.querySelector('.comments-list')).toBeFalsy();
      expect(compiled.querySelector('.empty-state')).toBeFalsy();
    });

    it('deve mostrar o estado "vazio" (empty) se o serviço retornar um array vazio', () => {
      commentsSubject.next([]);
      
      fixture.detectChanges();

      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('Ainda não há comentários.');
      
      expect(compiled.querySelector('.loading-state')).toBeFalsy();
      expect(compiled.querySelector('.comments-list')).toBeFalsy();
    });

    it('deve mostrar a lista de comentários quando o serviço retornar dados', () => {
      commentsSubject.next(mockComments);
      
      fixture.detectChanges();

      const commentItems = compiled.querySelectorAll('.comment-item');
      expect(commentItems.length).toBe(2);

      expect(compiled.querySelector('.loading-state')).toBeFalsy();
      expect(compiled.querySelector('.empty-state')).toBeFalsy();
    });
  });

  describe('HTML Rendering', () => {

    beforeEach(() => {
      commentsSubject.next(mockComments);
      fixture.detectChanges();
    });

    it('deve renderizar os dados do comentário corretamente (autor, conteúdo)', () => {
      const firstComment = compiled.querySelector('.comment-item');
      expect(firstComment?.textContent).toContain('Autor Um');
      expect(firstComment?.textContent).toContain('Que arte incrível!');
    });

    it('deve formatar a data do comentário usando o pipe (dd/MM/yyyy HH:mm)', () => {
      const datePipe = new DatePipe('en-US');
      const expectedDate = datePipe.transform(mockComments[0].dataComentario, 'dd/MM/yyyy HH:mm');

      const dateEl = compiled.querySelector('.comment-date');
      expect(dateEl?.textContent).toContain(expectedDate);
    });

    it('deve usar a imagem de fallback se urlFotoPerfil for nula ou vazia', () => {
      const avatars = compiled.querySelectorAll('.comment-avatar') as NodeListOf<HTMLImageElement>;
      
      expect(avatars[0].src).toContain('url/foto1.jpg');
      
      expect(avatars[1].src).toContain('placehold.co');
      expect(avatars[1].src).toContain('A'); 
    });
  });

  describe('Modal Close Events', () => {

    it('deve emitir "close" quando closeModal() é chamado', () => {
      spyOn(component.closeRequest, 'emit');
      component.closeModal();
      expect(component.closeRequest.emit).toHaveBeenCalledTimes(1);
    });

    it('deve chamar closeModal() quando o overlay é clicado', () => {
      spyOn(component, 'closeModal');
      const overlay = compiled.querySelector('.modal-overlay') as HTMLElement;
      overlay.click();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('NÃO deve chamar closeModal() quando o card do modal é clicado (stopPropagation)', () => {
      spyOn(component, 'closeModal');
      const card = compiled.querySelector('.modal-card') as HTMLElement;
      card.click();
      expect(component.closeModal).not.toHaveBeenCalled();
    });

    it('deve chamar closeModal() quando o botão "X" (close-button) é clicado', () => {
      spyOn(component, 'closeModal');
      const closeButton = compiled.querySelector('.close-button') as HTMLButtonElement;
      closeButton.click();
      expect(component.closeModal).toHaveBeenCalled();
    });
  });
});
