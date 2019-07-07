import { EventEmitter } from '@angular/core';
import { Loading } from '../loading/Loading';

export class Popup {
  static onSuccess: EventEmitter<string> = new EventEmitter();
  static onError: EventEmitter<string> = new EventEmitter();
  static onInfo: EventEmitter<string> = new EventEmitter();

  static success(success = 'Erfolgreich gespeichert') {
    Loading.hide();
    Popup.onSuccess.emit(success);
  }

  static info(info = 'info') {
    Loading.hide();
    Popup.onInfo.emit(info);
  }

  static error(error = 'error') {
    Loading.hide();
    Popup.onError.emit(error);
  }
}
