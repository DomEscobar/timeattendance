import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Popup } from '../Popup';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoPopupComponent {
  info;

  constructor(private changeDetection: ChangeDetectorRef) {
    Popup.onInfo.subscribe(info => {
      this.info = info;
      this.changeDetection.detectChanges();
    });
  }

  hide() {
    this.info = null;
    this.changeDetection.detectChanges();
  }
}
