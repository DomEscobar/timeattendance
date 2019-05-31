import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { AppService } from '../services/app.service';
import * as moment from 'moment';
import { BookingTime } from '../models/bookingTime';

@Component({
  selector: 'app-booking-times',
  templateUrl: './booking-times.component.html',
  styleUrls: ['./booking-times.component.less']
})
export class BookingTimesComponent implements AfterViewInit {

  public from: Date;
  public to: Date;
  public bookingTimes: BookingTime[];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public appService: AppService) { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.from = new Date();
      this.to = new Date();
      this.load();
    }, 400);

    this.bookingTimes = JSON.parse(JSON.stringify(this.appService.bookingTimes));
  }

  public load(): void {

    this.bookingTimes = [];
    let from = JSON.parse(JSON.stringify(this.from));
    let to = JSON.parse(JSON.stringify(this.to));

    this.appService.bookingTimes.forEach(o => {

      const oDate = moment(o.date, 'DD.MM.YYYY');
      from = moment(moment(from).format('DD.MM.YYYY'), 'DD.MM.YYYY');
      to = moment(moment(to).format('DD.MM.YYYY'), 'DD.MM.YYYY');

      // tslint:disable-next-line: max-line-length
      if (from <= oDate && oDate <= to) {
        this.bookingTimes.push(o);
      }

    });
    this.bookingTimes = JSON.parse(JSON.stringify(this.bookingTimes));
  }
}
