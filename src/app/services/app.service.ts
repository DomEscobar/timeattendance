import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { BookingTime } from '../models/bookingTime';
import { BookingKey } from '../models/bookingKey';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import moment from 'moment';
declare const toastr: any;
import * as cfg from '../../assets/server.json';
import { ApiService } from './api.service';
import { UserDetail } from '../models/userDetail';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { File, IWriteOptions } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

@Injectable({
  providedIn: 'root'
})

export class AppService {

  public static readonly USER = 'zt-u';
  private readonly TIMES = 'zt-bt';
  private readonly LATEST = 'zt-iw';

  private userSub: BehaviorSubject<User> = new BehaviorSubject(null);
  public user$: Observable<User> = this.userSub.asObservable();

  public bookingTimes: BookingTime[] = new Array();
  public bookingKeys: BookingKey[];
  public latestBookingTime: BookingTime;
  public selectedBookingKey: BookingKey;

  public userDetails: UserDetail[] = new Array();

  public isOnline = cfg.url != '';

  constructor(
    private file: File,
    private fileOpener: FileOpener,
    private exportAsService: ExportAsService,
    private apiService: ApiService,
    private http: HttpClient) {

    this.initUser();

    if (this.isOnline) {
      this.apiService.getAllBookingKeys().subscribe(async keys => {
        this.bookingKeys = keys;
        this.selectedBookingKey = keys[0];
        this.userDetails = await this.apiService.getAllUserDetails().toPromise();
        await this.initOnline();
      }, error => this.initOffline());

      return;
    }

    this.initOffline();
  }

  public async initOnline(): Promise<void> {
    if (this.getUser() != null) {
      this.bookingTimes = await this.apiService.getAllBookingTimesByUserId(this.getUser().userid).toPromise();
      this.updateLocaleStoreage();
    }
  }

  private initOffline(): void {
    this.http.get<BookingKey[]>('assets/bookingKeys.json').subscribe(data => {
      this.bookingKeys = data;
      this.selectedBookingKey = data[0];
      this.initBookingTimes();
      this.latestBookingTime = JSON.parse(localStorage.getItem(this.LATEST));
    });
  }

  private initUser(): void {
    const userEncrypt = localStorage.getItem(AppService.USER);

    if (userEncrypt == null) {
      if (!this.isOnline) {
        this.userSub.next(new User());
      }
      return;
    }

    const user = new User(JSON.parse(window.atob(userEncrypt)));

    if (user.cst == null) {
      return;
    }

    this.userSub.next(user);
  }

  private initBookingTimes(): void {
    const encryptTimes = localStorage.getItem(this.TIMES);

    if (encryptTimes == null) {
      return;
    }

    this.bookingTimes = JSON.parse(window.atob(encryptTimes));
  }

  private updateLocaleStoreage(): void {
    localStorage.setItem(this.TIMES, window.btoa(JSON.stringify(this.bookingTimes)));
    this.fetchLatestBookingTime();
  }

  private fetchLatestBookingTime(): void {
    const now = new Date();
    let closest: BookingTime = null;

    const todays = this.bookingTimes.filter(o => moment(o.date, 'DD.MM.YYYY').isSame(moment(), 'day'));

    for (let d of todays) {

      if (closest == null) {
        closest = JSON.parse(JSON.stringify(d));
        continue;
      }

      let date = moment(d.date, 'DD.MM.YYYY').toDate();
      let closestdate = moment(closest.date, 'DD.MM.YYYY').toDate();

      date = this.initTime(d, date);
      closestdate = this.initTime(closest, closestdate);

      if (date <= now && date > closestdate) {
        closest = JSON.parse(JSON.stringify(d));
      }
    }

    this.latestBookingTime = closest;
    localStorage.setItem(this.LATEST, JSON.stringify(this.latestBookingTime));
  }

  private initTime(d: BookingTime, date: Date): Date {
    date.setHours(Number(d.clockIn.split(':')[0]));
    date.setMinutes(Number(d.clockIn.split(':')[1]));

    if (d.clockOut != null && d.clockOut !== '') {
      date.setHours(Number(d.clockOut.split(':')[0]));
      date.setMinutes(Number(d.clockOut.split(':')[1]));
    }

    return date;
  }

  public getNameOfDetail(detailId: number): string {

    const detail = this.userDetails.find(o => o.detailid == detailId);

    if (detail == null) {
      return '';
    }

    return detail.name;
  }

  public deleteBookingTime(bookingTime: BookingTime): void {

    if (this.latestBookingTime != null && this.latestBookingTime.bookingkeyId == bookingTime.bookingkeyId) {
      toastr.error('Eine aktuelle Stempelung kann nicht gelöscht werden', 'Fehler');
      return;
    }

    this.bookingTimes = this.bookingTimes.filter(o => o.bookingkeyId != bookingTime.bookingkeyId);
    this.updateLocaleStoreage();
  }

  public async addBookingTime(bookingTime: BookingTime): Promise<void> {
    this.bookingTimes.unshift(bookingTime);
    this.latestBookingTime = bookingTime;

    if (this.isOnline) {
      await this.apiService.addBookingTime(bookingTime).toPromise();
    }

    this.updateLocaleStoreage();
  }

  public async updateBookingTime(bookingTime: BookingTime, updateLatest = true): Promise<void> {
    const bkTimeIndex = this.bookingTimes.findIndex(o => o.bookingTimeId == bookingTime.bookingTimeId);

    if (bkTimeIndex === -1) {
      return;
    }

    if (bookingTime.clockOut != null && bookingTime.clockOut != '') {
      bookingTime.actualTime = moment.utc(moment(bookingTime.clockOut, 'HH:mm').diff(moment(bookingTime.clockIn, 'HH:mm'))).format('HH:mm');
    }

    this.bookingTimes[bkTimeIndex] = bookingTime;
    if (updateLatest) {
      this.latestBookingTime = bookingTime;
    }

    if (this.isOnline) {
      await this.apiService.updateBookingTime(bookingTime).toPromise();
    }

    this.updateLocaleStoreage();
  }

  public getUser(): User {
    return this.userSub.getValue();
  }

  public setUser(user: User): void {
    this.userSub.next(user);
    localStorage.setItem(AppService.USER, window.btoa(JSON.stringify(this.getUser())));
  }

  public async updateUser(user: User): Promise<void> {

    if (this.isOnline) {
      await this.apiService.updateUser(user).toPromise();
      for (const detail of user.userDetails) {
        await this.apiService.addUserToDetail(Number(detail.userid), Number(detail.detailid), detail.value).toPromise();
      }
    }

    this.userSub.next(user);
    localStorage.setItem(AppService.USER, window.btoa(JSON.stringify(this.getUser())));
  }

  public isAuthenticated(): boolean {
    return this.getUser() != null;
  }

  public getReason(bsId: number): string {

    if (bsId == null) {
      return ' - ';
    }

    return this.bookingKeys.find(o => o.bookingKeyId == bsId).name;
  }

  public hasCreditals(): boolean {
    if (this.getUser() == null) {
      return false;
    }
    return this.getUser().firstname !== '' && this.getUser().lastname !== '';
  }

  public downloadExcel(element: HTMLElement) {

    const exportAsConfig: ExportAsConfig = {
      type: 'xls',
      elementId: element.id
    };

    this.exportAsService.get(exportAsConfig).subscribe((base64) => {
      this.savePDFApp(base64, 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Buchungszeiten.xls');
    });
  }

  public downloadPDF(element: HTMLElement, from: string, to: string, user: User, sumactualTime: string) {

    const exportAsConfig: ExportAsConfig = {
      type: 'pdf',
      elementId: element.id
    };

    this.exportAsService.get(exportAsConfig).subscribe((base64) => {
      this.savePDFApp(base64, 'pdf', `${from}_${to}_buchungszeiten.pdf`);
    }, error => {
      console.log(error);
    });
  }

  private savePDFApp(base64Data: string, mime: string, dataname: string): void {

    let contentType = this.convertBaseb64ToBlob(base64Data, `data:application/${mime};base64`);

    const directory = this.file.dataDirectory;
    let options: IWriteOptions = { replace: true };

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

  public logout(): void {
    localStorage.clear();
    this.setUser(null);
    this.bookingTimes = [];
    this.latestBookingTime = null;
    this.userDetails = [];
  }
}
