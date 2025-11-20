import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { UsuarioService } from './usuario.service';
import { environment } from '../../../environments/environment';
import { UsuarioSearchResultDto } from '../../core/models/usuario-search-response.model';
import { UsuarioProfile } from '../../core/models/usuario-profile.model';

fdescribe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/Usuario`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsuarioService]
    });

    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search users with query params', () => {
    const query = 'test';
    const category = 'Pintura';
    
    const mockResults: UsuarioSearchResultDto[] = [
      { id: '1', username: 'user1', nomeCompleto: 'User One', urlFotoPerfil: '', seguidoPeloUsuarioAtual: false }
    ];

    service.searchUsers(query, category).subscribe(results => {
      expect(results).toEqual(mockResults);
    });

    const req = httpMock.expectOne(req => 
      req.url === `${apiUrl}/search` && 
      req.params.get('query') === query &&
      req.params.get('categoriaPrincipal') === category
    );

    expect(req.request.method).toBe('GET');
    req.flush(mockResults);
  });

  it('should get user profile by username', () => {
    const username = 'artist_one';
    const mockProfile: UsuarioProfile = {
      id: '1', username: 'artist_one', nomeCompleto: 'Artist One',
      contagemSeguidores: 10, contagemSeguindo: 5, seguidoPeloUsuarioAtual: false,
      urlFotoPerfil: '', categoriaPrincipalId: 'cat-1', categoriaPrincipalNome: 'Arte'
    };

    service.getProfile(username).subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${apiUrl}/${username}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('should follow a user (POST)', () => {
    const userId = '123';

    service.followUser(userId).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/${userId}/follow`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush({});
  });

  it('should unfollow a user (DELETE)', () => {
    const userId = '123';

    service.unfollowUser(userId).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/${userId}/follow`);
    expect(req.request.method).toBe('DELETE');

    req.flush({});
  });

  describe('updateMyProfile', () => {
    
    it('should update profile with all fields and a file', () => {
      const textData = {
        bio: 'Nova bio',
        UrlPortifolio: 'http://port.com',
        UrlLinkedin: 'http://linkedin.com/in/me',
        UrlInstagram: 'http://insta.com/me',
        categoriaPrincipalId: 'cat-new'
      };
      const file = new File(['(conteúdo)'], 'avatar.png', { type: 'image/png' });
      
      const mockResponse: UsuarioProfile = { id: '1', ...textData } as any;

      service.updateMyProfile(textData, file).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/me`);
      expect(req.request.method).toBe('PUT');
      
      const body = req.request.body as FormData;
      expect(body instanceof FormData).toBeTrue();
      
      expect(body.get('Bio')).toBe(textData.bio);
      expect(body.get('UrlPortifolio')).toBe(textData.UrlPortifolio);
      expect(body.get('UrlLinkedin')).toBe(textData.UrlLinkedin);
      expect(body.get('UrlInstagram')).toBe(textData.UrlInstagram);
      expect(body.get('CategoriaPrincipalId')).toBe(textData.categoriaPrincipalId);
      
      const fileSent = body.get('FotoPerfil') as File;
      expect(fileSent).toBeTruthy();
      expect(fileSent.name).toBe('avatar.png');

      req.flush(mockResponse);
    });

    it('should update profile with partial data and NO file', () => {
      const textData = {
        bio: 'Apenas bio mudou'
      };
      
      service.updateMyProfile(textData, null).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/me`);
      const body = req.request.body as FormData;

      expect(body.get('Bio')).toBe(textData.bio);
      
      expect(body.has('UrlPortifolio')).toBeFalse();
      expect(body.has('UrlLinkedin')).toBeFalse();
      expect(body.has('FotoPerfil')).toBeFalse();

      req.flush({});
    });
  });
});