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
import { BookingTimeDetailComponent } from './booking-times/booking-time-detail/booking-time-detail.component';
import { ModalDirective } from './components/modal.directive';
import { TimeInputComponent } from './components/time-input/time-input.component';
import 'moment/locale/de';
import { SavePanelComponent } from './components/save-panel/save-panel.component';
import { FeatherModule } from 'angular-feather';
import { Hexagon, Moon, Sun, Trash } from 'angular-feather/icons';
import { LoadingComponent } from '../static/loading/loading.component';
import { LoginComponent } from './login/login.component';
import { CoreModule } from './core/core.module';

const icons = {
  Hexagon,
  Moon,
  Sun,
  Trash
};

@NgModule({
  declarations: [
    LoadingComponent,
    AppComponent,
    DashboardComponent,
    SelectComponent,
    BookingTimesComponent,
    DatepickerComponent,
    ProfileComponent,
    BookingTimeDetailComponent,
    ModalDirective,
    TimeInputComponent,
    SavePanelComponent,
    LoginComponent
  ],
  imports: [
    CoreModule,
    BrowserModule,
    MomentModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    FeatherModule.pick(icons),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
