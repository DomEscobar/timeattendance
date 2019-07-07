import { Injectable, Injector, OnInit, ChangeDetectorRef } from '@angular/core';
import { BaseService } from './baseService';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from 'src/app/models/user';
import { UserDetail } from '../models/userDetail';
import { UserDetailRelation } from '../models/userDetailRelation';
import { BookingTime } from '../models/bookingTime';
import { BookingKey } from '../models/bookingKey';
/**
 * Service handles all REST http requests
 *  TODO : map correctly into Obeject
 * @export
 * @class AppService
 * @extends {BaseService}
 * @implements {OnInit}
 */
@Injectable({
  providedIn: 'root'
})

export class ApiService extends BaseService {

  constructor(injector: Injector) {
    super(injector);
  }

  /**
   *
   *  --- User details
   *
   */

  public deleteUserDetail(userDetail: UserDetail): Observable<any> {
    return this.get('deleteUserDetail.php', `id=${userDetail.detailid}`, true).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public updateUserDetailRelation(userDetail: UserDetail): Observable<any> {
    return this.post('updateUserDetailRelation.php', userDetail, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public updateUserDetail(userDetail: UserDetail): Observable<any> {
    return this.post('updateUserDetail.php', userDetail, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public getUserDetailsByUserId(user: User): Observable<UserDetailRelation[]> {
    return this.get('getUserDetailsByUserId.php', `id=${user.userid}`, false).pipe(map((response: any) => {
      return <UserDetailRelation[]>response;
    }));
  }

  public getAllUserDetails(): Observable<UserDetail[]> {
    return this.get('getAllUserDetails.php', '').pipe(map((response: any) => {
      return <UserDetail[]>response;
    }));
  }

  public addUserDetail(userDetail: UserDetail): Observable<User> {
    return this.post('addUserDetail.php', userDetail, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  /**
    *
    *  --- Users
    *
    */

  public getAllUsers(): Observable<User[]> {
    return this.get('getAllUsers.php', '', false).pipe(map((response: any) => {
      return <User[]>response;
    }));
  }

  public addUser(user: User): Observable<any> {
    return this.post('addUser.php', user, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public getUserbyId(userId: number): Observable<User> {
    return this.get('getUserbyId.php', `id=${userId}`).pipe(map((response: any) => {
      return <User>response;
    }));
  }

  public updateUser(user: User): Observable<any> {
    return this.post('updateUser.php', user, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public deleteUser(user: User): Observable<any> {
    return this.get('deleteUser.php', `id=${user.userid}`, true).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public addUserToDetail(userid: number, detailid: any, value: string): Observable<any> {

    const relation = { userid: userid, detailid: detailid, value: value };

    return this.post('addUserToDetail.php', relation, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  /**
   *
   * ---- BookingTIme stuff ----
   */

  public addBookingTime(bookingTime: BookingTime): Observable<any> {
    return this.post('bookingTime/addBookingTime.php', bookingTime, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public updateBookingTime(bookingTime: BookingTime): Observable<any> {
    return this.post('bookingTime/updateBookingTime.php', bookingTime, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public getAllBookingTimesByUserId(userId: number): Observable<BookingTime[]> {
    return this.get('bookingTime/getAllBookingTimesByUserId.php', `id=${userId}`, false).pipe(map((response: any) => {
      return <BookingTime[]>response;
    }));
  }

  public deleteBookingTime(bookingTImeId: number): Observable<any> {
    return this.get('bookingTime/deleteBookingTime.php', `id=${bookingTImeId}`, true).pipe(map((response: any) => {
      return <any>response;
    }));
  }


  /**
   *
   * ---- bookingkey stuff ----
   */

  public addBookingKey(bookingKey: BookingKey): Observable<any> {
    return this.post('bookingKey/addBookingKey.php', bookingKey, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public updateBookingKey(bookingKey: BookingKey): Observable<any> {
    return this.post('bookingKey/updateBookingKey.php', bookingKey, false).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public getAllBookingKeys(): Observable<BookingKey[]> {
    return this.get('bookingKey/getAllBookingKeys.php', '', false).pipe(map((response: any) => {
      return <BookingKey[]>response;
    }));
  }

  public deleteBookingKey(keyId: number): Observable<any> {
    return this.get('bookingKey/deleteBookingKey.php', `id=${keyId}`, true).pipe(map((response: any) => {
      return <any>response;
    }));
  }

  public login(username: string, password: string): Observable<User> {
    return this.post('login.php', { username: username, password: password }, false).pipe(map((response: any) => {
      return <User>response;
    }));

  }
}
