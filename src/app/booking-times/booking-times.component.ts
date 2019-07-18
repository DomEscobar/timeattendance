import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { AppService } from '../services/app.service';
import moment from 'moment';
import { BookingTime } from '../models/bookingTime';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { PdfViewComponent } from '../components/pdf-view/pdf-view.component';
import { FileExportService } from '../services/file-export.service';
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
  public selectedBooking: BookingTime;
  public sumactualTime: string;

  public isOnPdfView: boolean;

  @ViewChild(PdfViewComponent) pdfViewComponent: PdfViewComponent;

  constructor(
    public fileExportService: FileExportService,
    public appService: AppService) { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.from = moment(new Date()).startOf('month').toDate();
      this.to = moment(new Date()).endOf('month').toDate();
      this.bookingTimes = JSON.parse(JSON.stringify(this.appService.bookingTimes));
      this.load();
    }, 400);
  }

  public addBooking(): void {
    const bookingTime = new BookingTime();
    bookingTime.date = moment(this.from).format('DD.MM.YYYY');

    this.appService.addBookingTime(bookingTime);
    this.load();
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
    this.calcActualtime();
  }

  public export() {
    this.setData();
    this.isOnPdfView = true;
  }

  private setData(): void {
    const from = moment(this.from).format('DD.MM.YYYY');
    const to = moment(this.to).format('DD.MM.YYYY');
    const user = this.appService.getUser();

    this.fileExportService.setData(user, from, to, this.bookingTimes, this.calcActualtime);
  }

  public updateBookingTime(bookingTime: BookingTime) {

    this.appService.updateBookingTime(bookingTime, false);
    this.selectedBooking = null;
    this.load();
  }

  public deleteBookingTime(bookingTime: BookingTime): void {

    this.appService.deleteBookingTime(bookingTime);
    this.selectedBooking = null;
    this.load();
  }

  private calcActualtime() {
    let hours = 0;
    let minutes = 0;
    this.bookingTimes.forEach(element => {

      if (element.actualTime == null) {
        return;
      }
      const sp = element.actualTime.split(':');
      hours = hours + Number(sp[0]);
      minutes = minutes + Number(sp[1]);

    });

    const minutesadd = (minutes / 60);
    hours = hours + (minutesadd >= 1 ? Math.round(minutesadd) : 0);

    this.sumactualTime = hours + ':' + minutes;
  }
}
