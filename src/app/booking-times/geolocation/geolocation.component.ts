import { Component, OnInit, Input } from '@angular/core';
import { BookingLocation } from '../../models/bookingLocation';

@Component({
  selector: 'app-geolocation',
  templateUrl: './geolocation.component.html',
  styleUrls: ['./geolocation.component.less']
})
export class GeolocationComponent implements OnInit
{
  private _bookingLocations: BookingLocation[];

  @Input()
  set bookingLocations(bookingLocations: BookingLocation[])
  {
    if (bookingLocations == null || bookingLocations.length == 0)
    {
      return;
    }

    this.selected = bookingLocations[0];
    this._bookingLocations = bookingLocations;
  }

  get bookingLocations()
  {
    return this._bookingLocations;
  }

  selected: BookingLocation;

  constructor() { }

  ngOnInit()
  {
  }

  select(bookingLocation: BookingLocation): void
  {
    this.selected = bookingLocation;
  }
}
