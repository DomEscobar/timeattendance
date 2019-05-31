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

    if (this.isClockIn()) {
      const latest = Object.assign({}, this.appservice.latestBookingTime);
      latest.clockOut = this.dateFormatPipe.transform(new Date(), 'HH:mm');
      latest.actualTime = moment.utc(moment(latest.clockOut, 'HH:mm').diff(moment(latest.clockIn, 'HH:mm'))).format('HH:mm');
      this.appservice.updateBookingTime(latest);
      return;
    }

    const bookingTime = new BookingTime();
    bookingTime.bsId = this.appservice.selectedBookingKey.id;
    bookingTime.clockIn = this.dateFormatPipe.transform(new Date(), 'HH:mm');

    this.appservice.addBookingTime(bookingTime);
  }


  public isClockIn(): boolean {
    return this.appservice.latestBookingTime ? this.appservice.latestBookingTime.clockOut == null : false;
  }

  public getDateFormated(): string {
    if (this.appservice.latestBookingTime == null) {
      return;
    }

    return this.appservice.latestBookingTime.date;
  }
}
