import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { BookingTime } from '../models/bookingTime';
import { BookingKey } from '../models/bookingKey';
import { HttpClient } from '@angular/common/http';

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

  public updateUser(user: User): void {
    this.user = user;
    localStorage.setItem(this.USER, window.btoa(JSON.stringify(user)));
  }

  public getReason(bsId: number): string {
    if (bsId == null) {
      return ' - ';
    }

    return this.bookingKeys.find(o => o.id === bsId).name;
  }

  private updateLocaleStoreage(): void {
    localStorage.setItem(this.TIMES, window.btoa(JSON.stringify(this.bookingTimes)));
    localStorage.setItem(this.LATEST, JSON.stringify(this.latestBookingTime));
  }
}
