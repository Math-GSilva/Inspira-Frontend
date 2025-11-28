import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private snackBar: MatSnackBar) { }

  showSuccess(message: string): void {
    this.openSnackBar(message, 'success-snackbar');
  }

  showError(message: string): void {
    this.openSnackBar(message, 'error-snackbar');
  }

  private openSnackBar(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 700,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [panelClass]
    });
  }
}