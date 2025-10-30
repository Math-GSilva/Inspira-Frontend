import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ObraDeArte } from '../../core/models/obra-de-arte.model';

@Injectable({
  providedIn: 'root'
})
export class PostStateService {

  // Um Subject é um "anunciador" de eventos
  private newPostSubject = new Subject<ObraDeArte>();

  // O componente do feed vai "ouvir" este Observable
  public newPost$ = this.newPostSubject.asObservable();

  /**
   * Chamado pelo modal de novo post para anunciar que um post foi criado.
   * @param post O objeto ObraDeArte retornado pela API.
   */
  announceNewPost(post: ObraDeArte) {
    this.newPostSubject.next(post);
  }
}