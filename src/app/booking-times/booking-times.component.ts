import { Component, AfterViewInit } from '@angular/core';
import { AppService } from '../services/app.service';
import * as moment from 'moment';
import { BookingTime } from '../models/bookingTime';
declare const $: any;

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
    public appService: AppService) { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.from = new Date();
      this.to = new Date();
      this.bookingTimes = JSON.parse(JSON.stringify(this.appService.bookingTimes));
      this.load();
    }, 400);
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

  public downloadExcel() {
    const ele = document.getElementById('tblBu');
    this.appService.downloadExcel(ele);
  }

  public downloadPDF() {
    const ele = document.getElementById('tblBu').outerHTML;
    // tslint:disable-next-line: max-line-length
    this.appService.downloadPDF(moment(this.from).format('DD.MM.YYYY') + ' - ' + moment(this.to).format('DD.MM.YYYY') + ' - ' + this.appService.user.firstname, ele);
  }
}
