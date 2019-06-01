import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { BookingTime } from '../models/bookingTime';
import { BookingKey } from '../models/bookingKey';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private readonly USER = 'zt-u';
  private readonly TIMES = 'zt-bt';
  private readonly LATEST = 'zt-iw';

  public user: User;
  public bookingTimes: BookingTime[] = new Array();
  public bookingKeys: BookingKey[];
  public latestBookingTime: BookingTime;
  public selectedBookingKey: BookingKey;

  public getSignature: BehaviorSubject<string> = new BehaviorSubject(null);
  public getSignature$: Observable<any> = this.getSignature.asObservable();

  constructor(private http: HttpClient) {

    this.http.get<BookingKey[]>('assets/bookingKeys.json').subscribe(data => {
      this.bookingKeys = data;
      this.selectedBookingKey = data[0];
      this.initUser();
      this.initBookingTimes();
      this.latestBookingTime = JSON.parse(localStorage.getItem(this.LATEST));
    });
  }

  private initUser(): void {
    const userEncrypt = localStorage.getItem(this.USER);

    if (userEncrypt == null) {
      this.user = new User();
      return;
    }
    this.user = new User(JSON.parse(window.atob(userEncrypt)));
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
    localStorage.setItem(this.LATEST, JSON.stringify(this.latestBookingTime));
  }

  public addBookingTime(bookingTime: BookingTime): void {
    this.bookingTimes.unshift(bookingTime);
    this.latestBookingTime = bookingTime;
    this.updateLocaleStoreage();
  }

  public updateBookingTime(bookingTime: BookingTime): void {
    const bkTimeIndex = this.bookingTimes.findIndex(o => o.guid === bookingTime.guid);

    if (bkTimeIndex === -1) {
      return;
    }

    this.bookingTimes[bkTimeIndex] = bookingTime;
    this.latestBookingTime = bookingTime;
    this.updateLocaleStoreage();
  }

  public updateUser(): void {
    localStorage.setItem(this.USER, window.btoa(JSON.stringify(this.user)));
  }

  public getReason(bsId: number): string {
    if (bsId == null) {
      return ' - ';
    }

    return this.bookingKeys.find(o => o.id === bsId).name;
  }

  public hasCreditals(): boolean {
    if (this.user == null) {
      return false;
    }
    return this.user.firstname !== '' && this.user.lastname !== '';
  }

  public downloadExcel(element: HTMLElement) {
    let uri = 'data:application/vnd.ms-excel;base64,';
    let template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>';
    let base64 = (s) => { return window.btoa(unescape(encodeURIComponent(s))); };
    const format = (s, c) => { return s.replace(/{(\w+)}/g, (m, p) => { return c[p]; }) };
    var ctx = { worksheet: 'Worksheet', table: element.innerHTML };
    window.location.href = uri + base64(format(template, ctx));
  }

  public downloadPDF(name: string, tableHTML: string) {
    var style = '<style> table{width:100%;}  th, td {  border: 1px solid #f2f2f2; }    thead { background: #ffffff; text-align:left;  color: #5c5c5c; }  .table th,    .table td {   padding: 10px 10px; font-size: 11px;  } </style>';

    var win = window.open('', '', 'height=700,width=700');

    win.document.write('<html><head>');
    win.document.write('<title>' + name + '</title>');
    win.document.write(style);
    win.document.write('</head>');
    win.document.write('<body>');
    win.document.write(tableHTML);
    win.document.write('</body></html>');

    win.document.close();
    win.print();
  }
}
