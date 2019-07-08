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

  public userDetails: UserDetail[];

  public isOnline = cfg.url != '';

  constructor(

    private apiService: ApiService,
    private http: HttpClient) {

    this.initUser();

    if (this.isOnline) {
      this.apiService.getAllBookingKeys().subscribe(async keys => {
        this.bookingKeys = keys;
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

  public addBookingTime(bookingTime: BookingTime): void {
    this.bookingTimes.unshift(bookingTime);
    this.latestBookingTime = bookingTime;
    this.updateLocaleStoreage();
  }

  public updateBookingTime(bookingTime: BookingTime, updateLatest = true): void {
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

    this.updateLocaleStoreage();
  }

  public getUser(): User {
    return this.userSub.getValue();
  }

  public setUser(user: User): void {
    this.userSub.next(user);
    localStorage.setItem(AppService.USER, window.btoa(JSON.stringify(this.getUser())));
  }

  public updateUser(user: User): void {
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
    let uri = 'data:application/vnd.ms-excel;base64,';
    let template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>';
    let base64 = (s) => { return window.btoa(unescape(encodeURIComponent(s))); };
    const format = (s, c) => { return s.replace(/{(\w+)}/g, (m, p) => { return c[p]; }) };
    var ctx = { worksheet: 'Worksheet', table: element.innerHTML };
    window.location.href = uri + base64(format(template, ctx));
  }

  public downloadPDF(tableHTML: string, from: string, to: string, user: User, sumactualTime: string) {
    var style = '<style> @page { margin: 0; }  @media print {      @page { margin: 0; }      body { margin: 1.6cm; }  }  p{font-size:12px;} table{width:100%;} .table-striped tbody tr:nth-of-type(odd) {  background-color: rgba(89, 89, 89, 0.05);} .table td{ text-align:center; border-bottom: 1px solid #eaeaea; } table thead th { text-align:center; vertical-align: bottom; border-bottom: 2px solid #dee2e6;} thead { background: #ffffff; text-align:left;  color: #5c5c5c; }  .table th,    .table td {   padding: 8px 10px; font-size: 11px;  } </style>';

    var win = window.open('', '', 'height=700,width=700');

    win.document.write('<html><head>');
    win.document.write('<title>' + from + ' - ' + to + '_' + user.lastname + '_' + user.lastname + '</title>');
    win.document.write(style);
    win.document.write('</head>');
    win.document.write('<body>');
    win.document.write('<p style="float:right;"><b> Zeitraum </b> : ' + from + ' - ' + to + ' </p>');


    win.document.write('<p> <b>Name, Vorname </b>: ' + user.lastname + ', ' + user.firstname + ' </p>');

    for (let detail of user.userDetails) {
      win.document.write('<p><b> ' + this.getNameOfDetail(detail.detailid) + ' </b> : ' + detail.value + ' </p>');
    }

    win.document.write(tableHTML);
    win.document.write('    <div style="padding: 5px; font-size: 14px; border-top: 1px solid black;"> Gesammte Arbeitszeit :' + sumactualTime + '</div>');
    win.document.write('</body></html>');

    win.document.close();
    win.print();
  }
}
