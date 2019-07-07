import { EventEmitter } from "@angular/core";

export class Loading {
  static onLoad: EventEmitter<boolean> = new EventEmitter();

  static show() {
    Loading.onLoad.emit(true);
  }

  static hide() {
    Loading.onLoad.emit(false);
  }
}
