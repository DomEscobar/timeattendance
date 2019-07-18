import { Injectable } from '@angular/core';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { File, IWriteOptions } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { User } from '../models/user';
import { BookingTime } from '../models/bookingTime';
import { Observable, of } from 'rxjs';

@Injectable()
export class FileExportService {

  public isApp: boolean;

  public user: User;
  public bookingTimes: BookingTime[];
  public from: string;
  public to: string;
  public actualTime: string;

  constructor(
    private file: File,
    private fileOpener: FileOpener,
    private exportAsService: ExportAsService) {
    this.isApp = window.hasOwnProperty('cordov');
  }

  public downloadExcel(): Promise<void> {

    return new Promise((resolve, reject) => {
      const exportAsConfig: ExportAsConfig = {
        type: 'xls',
        elementId: 'printView'
      };

      // -- As Web
      if (!this.isApp) {
        this.exportAsService.save(exportAsConfig, 'Buchungszeiten').subscribe(() => {
          return resolve();
        });
        return;
      }

      this.exportAsService.get(exportAsConfig).subscribe((base64) => {
        this.savePDFApp(base64, 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Buchungszeiten.xls');
        return resolve();
      });
    });
  }

  public setData(user, from, to, bookingTimes, actualTime): void {
    this.user = user;
    this.from = from;
    this.to = to;
    this.bookingTimes = bookingTimes;
    this.actualTime = actualTime;
  }

  public downloadPDF(): Promise<void> {
    return new Promise((resolve, reject) => {

      const exportAsConfig: ExportAsConfig = {
        type: 'pdf',
        elementId: 'printView'
      };

      // -- As Web
      if (!this.isApp) {
        this.exportAsService.save(exportAsConfig, 'Buchungszeiten').subscribe(() => {
          return resolve();
        });
        return;
      }

      this.exportAsService.get(exportAsConfig).subscribe((base64) => {
        this.savePDFApp(base64, 'pdf', `Buchungszeiten.pdf`);
        return resolve();
      }, error => {
        console.log(error);
      });
    });
  }

  private savePDFApp(base64Data: string, mime: string, dataname: string): void {

    const contentType = this.convertBaseb64ToBlob(base64Data, `data:application/${mime};base64`);

    const directory = this.file.dataDirectory;
    const options: IWriteOptions = { replace: true };

    this.file.writeFile(directory, dataname, contentType, options)
      .then((success) => {
        this.fileOpener.open(this.file.dataDirectory + dataname, `application/${mime}`)
          .then(() => console.log('File is opened'))
          .catch(e => console.log('Error opening file', e));

      }).catch(function (error) {
        console.error('oops, something went wrong!', error);
      });
  }

  convertBaseb64ToBlob(b64Data, contentType): Blob {
    contentType = contentType || '';
    const sliceSize = 512;
    b64Data = b64Data.replace(/^[^,]+,/, '');
    b64Data = b64Data.replace(/\s/g, '');
    const byteCharacters = window.atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }


}
