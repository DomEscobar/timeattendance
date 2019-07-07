import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Popup } from '../Popup';

@Component({
  selector: 'acc-success-popup',
  templateUrl: './success-popup.component.html',
  styleUrls: ['./success-popup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuccessPopupComponent
{
  success;

  constructor(private changeDetection: ChangeDetectorRef)
  {
    Popup.onSuccess.subscribe(success =>
    {
      this.success = success;
      this.changeDetection.detectChanges();

      setTimeout(() =>
      {
        this.hide();
      }, 2000);
    });
  }

  hide()
  {
    this.success = null;
    this.changeDetection.detectChanges();
  }
}
