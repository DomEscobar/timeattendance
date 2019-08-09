import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { BookingLocation } from '../models/bookingLocation';
import { ApiService } from './api.service';
import { VariablesService } from './variables.service';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService
{
  constructor(
    private variablesService : VariablesService,
    private apiService: ApiService,
    private geolocation: Geolocation)
  {

  }

  public addBookingLocation(bookintTimeId: number, isClockIn: boolean): void
  {
    const bookingLocation = new BookingLocation();
    bookingLocation.bookingTimeId = bookintTimeId;
    bookingLocation.isClockIn = isClockIn;

    if (this.variablesService.isApp)
    {
      this.geolocation.getCurrentPosition().then(async (resp) =>
      {
        bookingLocation.latitude = resp.coords.latitude;
        bookingLocation.longitude = resp.coords.longitude;
        await this.apiService.addBookingLocation(bookingLocation).toPromise().catch(error =>
        {
          alert(error);
        });
      }).catch((error) =>
      {
        console.log('Error getting location', error);
      });
      return;
    }

    // In Browser
    if (navigator.geolocation)
    {
      navigator.geolocation.getCurrentPosition(async (position: Position) =>
      {
        if (position)
        {
          bookingLocation.latitude = position.coords.latitude;
          bookingLocation.longitude = position.coords.longitude;

          await this.apiService.addBookingLocation(bookingLocation).toPromise().catch(error =>
          {
            alert(error);
          });
        }
      },
        (error: PositionError) => console.log(error));
    } else
    {
      alert("Geolocation is not supported by this browser.");
    }
  }
}
