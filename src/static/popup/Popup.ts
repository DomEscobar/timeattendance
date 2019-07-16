import { Loading } from '../loading/Loading';
declare const toastr: any;

export class Popup {

  static success(success = 'Erfolgreich gespeichert') {
    Loading.hide();
    toastr.success(success, 'Erfolg')
  }

  static info(info = 'info') {
    Loading.hide();
    toastr.info(info, 'Info')
  }

  static error(error = 'error') {
    Loading.hide();
    toastr.error(error, 'Error!')
  }
}
