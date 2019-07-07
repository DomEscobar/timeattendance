import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Popup } from '../Popup';

@Component({
  selector: 'acc-error-popup',
  templateUrl: './error-popup.component.html',
  styleUrls: ['./error-popup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPopupComponent {
  error;

  constructor(private changeDetection: ChangeDetectorRef) {
    Popup.onError.subscribe(error => {
      this.fetchError(error);
      setTimeout(() => {
        this.hide();
      }, 5000);
    });
  }

  private fetchError(error) {
    if (error._body !== '' && error instanceof Response) {
      this.error = error.json();
    } else {
      this.error = error;
    }
    this.changeDetection.detectChanges();

  }

  hide() {
    this.error = null;
    this.changeDetection.detectChanges();
  }
}
