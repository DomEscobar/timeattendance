import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { BookingTime } from '../models/bookingTime';
import { BookingKey } from '../models/bookingKey';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import moment from 'moment';
declare const toastr: any;
import { ApiService } from './api.service';
import { UserDetail } from '../models/userDetail';
import { GeolocationService } from './geolocation.service';
import { VariablesService } from './variables.service';

@Injectable({
  providedIn: 'root'
})

export class AppService
{

  public static readonly USER = 'zt-u';
  public readonly USERDETAILS = 'zt-ud';
  public readonly TIMES = 'zt-bt';
  public readonly LATEST = 'zt-iw';

  private userSub: BehaviorSubject<User> = new BehaviorSubject(null);
  public user$: Observable<User> = this.userSub.asObservable();

  public bookingTimes: BookingTime[] = new Array();
  public bookingKeys: BookingKey[];
  public latestBookingTime: BookingTime;
  public selectedBookingKey: BookingKey;

  public userDetails: UserDetail[] = new Array();

  constructor(
    private variablesService : VariablesService,
    private apiService: ApiService,
    private geolocationService: GeolocationService,
    private http: HttpClient)
  {
  }

  public async prepareApp(): Promise<void>
  {
    this.initUser();

    if (this.variablesService.isOnline)
    {
      this.apiService.getAllBookingKeys().subscribe(async keys =>
      {
        this.bookingKeys = keys;
        this.selectedBookingKey = keys[0];
        this.userDetails = await this.apiService.getAllUserDetails().toPromise();
        await this.initOnline();
      }, error => this.initOffline());

      return;
    }

    await this.initOffline();
  }

  public async initOnline(): Promise<void>
  {
    if (this.getUser() != null)
    {
      this.bookingTimes = await this.apiService.getAllBookingTimesByUserId(this.getUser().userid).toPromise();
      this.updateLocaleStoreage();
    }
  }

  private initOffline(): Promise<void>
  {
    return new Promise((resolve, reject) =>
    {
      this.http.get<BookingKey[]>('assets/bookingKeys.json').subscribe(data =>
      {
        this.bookingKeys = data;
        this.selectedBookingKey = data[0];
        this.initBookingTimes();
        this.latestBookingTime = JSON.parse(localStorage.getItem(this.LATEST));

        this.userDetails = JSON.parse(localStorage.getItem(this.USERDETAILS));
        if (this.userDetails == null)
        {
          this.userDetails = new Array();
        }

        resolve();
      });
    });
  }

  public addUserDetail(newDetail: UserDetail): void
  {
    this.userDetails.push(newDetail);
    localStorage.setItem(this.USERDETAILS, JSON.stringify(this.userDetails));
  }

  public removeUserDetail(detailId: number): void
  {
    this.userDetails = this.userDetails.filter(o => o.detailid != detailId);
    localStorage.setItem(this.USERDETAILS, JSON.stringify(this.userDetails));
  }

  private initUser(): void
  {
    const userEncrypt = localStorage.getItem(AppService.USER);

    if (userEncrypt == null)
    {
      if (!this.variablesService.isOnline)
      {
        this.userSub.next(new User());
      }
      return;
    }

    const user = new User(JSON.parse(window.atob(userEncrypt)));

    this.userSub.next(user);
  }

  private initBookingTimes(): void
  {
    const encryptTimes = localStorage.getItem(this.TIMES);

    if (encryptTimes == null)
    {
      return;
    }

    this.bookingTimes = JSON.parse(window.atob(encryptTimes));
  }

  private updateLocaleStoreage(): void
  {
    localStorage.setItem(this.TIMES, window.btoa(JSON.stringify(this.bookingTimes)));
    this.fetchLatestBookingTime();
  }

  private fetchLatestBookingTime(): void
  {
    const now = new Date();
    let closest: BookingTime = null;

    const todays = this.bookingTimes.filter(o => moment(o.date, 'DD.MM.YYYY').isSame(moment(), 'day'));

    for (let d of todays)
    {

      if (closest == null)
      {
        closest = JSON.parse(JSON.stringify(d));
        continue;
      }

      let date = moment(d.date, 'DD.MM.YYYY').toDate();
      let closestdate = moment(closest.date, 'DD.MM.YYYY').toDate();

      date = this.initTime(d, date);
      closestdate = this.initTime(closest, closestdate);

      if (date <= now && date > closestdate)
      {
        closest = JSON.parse(JSON.stringify(d));
      }
    }

    this.latestBookingTime = closest;
    localStorage.setItem(this.LATEST, JSON.stringify(this.latestBookingTime));
  }

  private initTime(d: BookingTime, date: Date): Date
  {
    date.setHours(Number(d.clockIn.split(':')[0]));
    date.setMinutes(Number(d.clockIn.split(':')[1]));

    if (d.clockOut != null && d.clockOut !== '')
    {
      date.setHours(Number(d.clockOut.split(':')[0]));
      date.setMinutes(Number(d.clockOut.split(':')[1]));
    }

    return date;
  }

  private calculateActualTime(bookingTime: BookingTime): void
  {
    bookingTime.actualTime = moment.utc(moment(bookingTime.clockOut, 'HH:mm').diff(moment(bookingTime.clockIn, 'HH:mm'))).format('HH:mm');
  }

  public getNameOfDetail(detailId: number): string
  {

    const detail = this.userDetails.find(o => o.detailid == detailId);

    if (detail == null)
    {
      return '';
    }

    return detail.name;
  }

  public deleteBookingTime(bookingTime: BookingTime): void
  {

    if (this.latestBookingTime != null && this.latestBookingTime.bookingkeyId == bookingTime.bookingkeyId)
    {
      toastr.error('Eine aktuelle Stempelung kann nicht gelöscht werden', 'Fehler');
      return;
    }

    this.bookingTimes = this.bookingTimes.filter(o => o.bookingkeyId != bookingTime.bookingkeyId);
    this.updateLocaleStoreage();
  }

  public async addBookingTime(bookingTime: BookingTime): Promise<void>
  {
    this.bookingTimes.unshift(bookingTime);
    this.latestBookingTime = bookingTime;

    if (this.variablesService.isOnline)
    {
      const bookingId = await this.apiService.addBookingTime(bookingTime).toPromise();
      this.geolocationService.addBookingLocation(bookingId, true);
    }

    this.updateLocaleStoreage();
  }

  public async updateBookingTime(bookingTime: BookingTime, updateLatest = true): Promise<void>
  {
    const bkTimeIndex = this.bookingTimes.findIndex(o => o.bookingTimeId == bookingTime.bookingTimeId);

    if (bkTimeIndex === -1)
    {
      return;
    }

    if (bookingTime.clockOut != null && bookingTime.clockOut != '')
    {
      this.calculateActualTime(bookingTime);
    }

    this.bookingTimes[bkTimeIndex] = bookingTime;

    if (updateLatest)
    {
      this.latestBookingTime = bookingTime;
    }

    if (this.variablesService.isOnline)
    {
      await this.apiService.updateBookingTime(bookingTime).toPromise();

      if (updateLatest)
      {
        this.geolocationService.addBookingLocation(bookingTime.bookingTimeId, false);
      }
    }

    this.updateLocaleStoreage();
  }

  public getUser(): User
  {
    return this.userSub.getValue();
  }

  public setUser(user: User): void
  {
    this.userSub.next(user);
    localStorage.setItem(AppService.USER, window.btoa(JSON.stringify(this.getUser())));
  }

  public async updateUser(user: User): Promise<void>
  {

    if (this.variablesService.isOnline)
    {
      await this.apiService.updateUser(user).toPromise();
      for (const detail of user.userDetails)
      {
        await this.apiService.addUserToDetail(Number(detail.userid), Number(detail.detailid), detail.value).toPromise();
      }
    }

    this.userSub.next(user);
    localStorage.setItem(AppService.USER, window.btoa(JSON.stringify(this.getUser())));
  }

  public isAuthenticated(): boolean
  {
    return this.getUser() != null;
  }

  public getReason(bsId: number): string
  {

    if (bsId == null)
    {
      return ' - ';
    }

    return this.bookingKeys.find(o => o.bookingKeyId == bsId).name;
  }

  public hasCreditals(): boolean
  {
    if (this.getUser() == null)
    {
      return false;
    }
    return this.getUser().firstname !== '' && this.getUser().lastname !== '';
  }

  public logout(): void
  {
    localStorage.removeItem(this.TIMES);
    localStorage.removeItem(this.LATEST);
    localStorage.removeItem(AppService.USER);
    this.userSub.next(null);
    this.bookingTimes = [];
    this.latestBookingTime = null;
    this.userDetails = [];
  }
}
