import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { BookingTime } from '../../models/bookingTime';
import { AppService } from '../../services/app.service';
import { BookingKey } from '../../models/bookingKey';
import moment from 'moment';
import { BookingLocation } from '../../models/bookingLocation';
import { ApiService } from '../../services/api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-booking-time-detail',
  templateUrl: './booking-time-detail.component.html',
  styleUrls: ['./booking-time-detail.component.less']
})
export class BookingTimeDetailComponent implements OnInit
{
  private _bookingTime: BookingTime;
  public bookingDate: Date;
  public selectedBookingKey: BookingKey;

  public isMapsVisible:boolean;
  public bookingLocations: BookingLocation[] = new Array();

  @Input()
  set bookingTime(bookingTime: BookingTime)
  {

    if (bookingTime == null) return;

    this.bookingDate = moment(bookingTime.date, 'DD.MM.YYYY').toDate();
    this.selectedBookingKey = this.appService.bookingKeys.find(o => o.bookingKeyId == bookingTime.bookingkeyId);
    this._bookingTime = JSON.parse(JSON.stringify(bookingTime));

    this.fetchBookingLocation();
  }

  get bookingTime(): BookingTime
  {
    return this._bookingTime;
  }

  @Output()
  onSave: EventEmitter<BookingTime> = new EventEmitter();

  @Output()
  onDelete: EventEmitter<boolean> = new EventEmitter();

  @Output()
  onCancel: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private apiService: ApiService,
    public appService: AppService) { }

  ngOnInit()
  {
  }

  public cancel(): void
  {
    this.onCancel.emit(true);
  }

  private fetchBookingLocation(): void
  {
    this.apiService.getBookingLocation(this.bookingTime.bookingTimeId).subscribe(data =>
    {
      this.bookingLocations = data;
    });
  }

  private markAsEdited(bookingTime: BookingTime): void
  {
    bookingTime.isEdited = true;
  }

  public save(): void
  {
    this.bookingTime.bookingkeyId = this.selectedBookingKey.bookingKeyId;
    this.markAsEdited(this.bookingTime);
    this.onSave.emit(this.bookingTime);
  }

  public deleteBtn(): void
  {
    this.onDelete.emit(true);
  }

  public changeDate($event: Date): void
  {
    this.bookingTime.date = moment($event).format('DD.MM.YYYY');
  }

  public showMessage(text: string): void
  {
    alert(text);
  }
}
