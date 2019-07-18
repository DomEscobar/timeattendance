import { Component, Output, EventEmitter, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { AppService } from '../../services/app.service';
import { FileExportService } from '../../services/file-export.service';
import { BookingTime } from '../../models/bookingTime';

@Component({
  selector: 'acc-pdf-view',
  templateUrl: './pdf-view.component.html',
  styleUrls: ['./pdf-view.component.less']
})
export class PdfViewComponent implements AfterViewInit {

  @Output()
  downloadFinished: EventEmitter<any> = new EventEmitter();

  public bookingPages: BookingTimePage[] = new Array();

  constructor(
    private changeDetectorRef : ChangeDetectorRef,
    public appService: AppService,
    public fileExportService: FileExportService) { }

  ngAfterViewInit() {
    let count = 0;
    let bookingTimePage: BookingTimePage = new BookingTimePage();

    for (const time of this.fileExportService.bookingTimes) {

      if (count === 25) {
        this.bookingPages.push(JSON.parse(JSON.stringify(bookingTimePage)));
        bookingTimePage = new BookingTimePage();
        count = 0;
        continue;
      }

      bookingTimePage.bookingTimes.push(time);
      count++;
    }

    if (count < 26) {
      this.bookingPages.push(JSON.parse(JSON.stringify(bookingTimePage)));
    }

    this.changeDetectorRef.detectChanges();
  }

  cancel(): void {
    this.downloadFinished.emit(false);
  }

  pdf(): void {
    this.fileExportService.downloadPDF().then(data => {
      this.downloadFinished.emit(true);
    });
  }

  excel(): void {
    this.fileExportService.downloadExcel().then(data => {
      this.downloadFinished.emit(true);
    });
  }

}

export class BookingTimePage {
  public bookingTimes: BookingTime[] = new Array();
}