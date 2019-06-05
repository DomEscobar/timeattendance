import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MomentModule } from 'ngx-moment';
import { HttpClientModule } from '@angular/common/http';
import { SelectComponent } from './components/select/select.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { BookingTimesComponent } from './booking-times/booking-times.component';
import { DatepickerComponent } from './components/datepicker/datepicker.component';
import { ProfileComponent } from './profile/profile.component';
import { SignaturePadDirective } from './components/signature-pad.directive';
import { BookingTimeDetailComponent } from './booking-times/booking-time-detail/booking-time-detail.component';
import { ModalDirective } from './components/modal.directive';
import { TimeInputComponent } from './components/time-input/time-input.component';
import { AboutComponent } from './about/about.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SelectComponent,
    BookingTimesComponent,
    DatepickerComponent,
    ProfileComponent,
    SignaturePadDirective,
    BookingTimeDetailComponent,
    ModalDirective,
    TimeInputComponent,
    AboutComponent
  ],
  imports: [
    BrowserModule,
    MomentModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
