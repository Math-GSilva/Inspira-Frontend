import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ObraDeArte } from '../../core/models/obra-de-arte.model';

@Injectable({
  providedIn: 'root'
})
export class PostStateService {
  private newPostSubject = new Subject<ObraDeArte>();
  public newPost$ = this.newPostSubject.asObservable();

  announceNewPost(post: ObraDeArte) {
    this.newPostSubject.next(post);
  }
}