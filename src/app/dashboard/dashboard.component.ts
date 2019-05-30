import { Component, OnInit } from '@angular/core';
import { BookingKey } from '../models/bookingKey';
import { AppService } from '../services/app.service';
import { BookingTime } from '../models/bookingTime';
import { DateFormatPipe } from 'ngx-moment';
import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  private dateFormatPipe: DateFormatPipe = new DateFormatPipe();

  constructor(
    public appservice: AppService) { }

  ngOnInit() {

  }

  public addNewTime() {
    const bookingTime = new BookingTime();
    bookingTime.isClockIn = !this.isClockIn();
    bookingTime.bsId = bookingTime.isClockIn ? this.appservice.selectedBookingKey.id : null;
    bookingTime.time = this.dateFormatPipe.transform(new Date(), 'hh:mm');

    this.appservice.addBookingTime(bookingTime);
  }

  public getReason(bsId: number): string {
    if (bsId == null) {
      return ' Gehen ';
    }

    return this.appservice.bookingKeys.find(o => o.id === bsId).name;
  }

  public isClockIn(): boolean {
    return this.appservice.latestBookingTime ? this.appservice.latestBookingTime.isClockIn : false;
  }
}
