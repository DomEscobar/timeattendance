import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MomentModule } from 'ngx-moment';
import { HttpClientModule } from '@angular/common/http';
import { SelectComponent } from './components/select/select.component';
import { BookingTimesComponent } from './booking-times/booking-times.component';
import { DatepickerComponent } from './components/datepicker/datepicker.component';
import { ProfileComponent } from './profile/profile.component';
import { BookingTimeDetailComponent } from './booking-times/booking-time-detail/booking-time-detail.component';
import { ModalDirective } from './components/modal.directive';
import { TimeInputComponent } from './components/time-input/time-input.component';
import 'moment/locale/de';
import { SavePanelComponent } from './components/save-panel/save-panel.component';
import { FeatherModule } from 'angular-feather';
import { Hexagon, Moon, Sun, Trash, LogOut, Download, CloudOff, Cloud, MapPin, MessageSquare, AlertOctagon } from 'angular-feather/icons';
import { LoadingComponent } from '../static/loading/loading.component';
import { LoginComponent } from './login/login.component';
import { CoreModule } from './core/core.module';
import { NFC, Ndef } from '@ionic-native/nfc/ngx';
import { LoadingPanelComponent } from './components/loading-panel/loading-panel.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ExportAsModule } from 'ngx-export-as';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { PdfViewComponent } from './components/pdf-view/pdf-view.component';
import { FileExportService } from './services/file-export.service';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { VariablesService } from './services/variables.service';
import { GeolocationComponent } from './booking-times/geolocation/geolocation.component';
import { AgmCoreModule } from '@agm/core';
import { ToNumberPipe } from './booking-times/geolocation/to-number.pipe';
import { ToBooleanPipe } from './booking-times/geolocation/to-boolean.pipe';

const icons = {
  Hexagon,
  Moon,
  Sun,
  Trash,
  LogOut,
  Download,
  CloudOff,
  Cloud,
  MessageSquare,
  AlertOctagon,
  MapPin
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
    LoginComponent,
    LoadingPanelComponent,
    PdfViewComponent,
    GeolocationComponent,
    ToNumberPipe,
    ToBooleanPipe
  ],
  imports: [
    AgmCoreModule.forRoot({
      apiKey: 'REMOVED_LEGACY_GOOGLE_MAPS_KEY'
    }),
    ExportAsModule,
    CoreModule,
    BrowserModule,
    MomentModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    FeatherModule.pick(icons)
  ],
  providers: [VariablesService, Geolocation, FileExportService, NFC, Ndef, File, FileOpener, { provide: LocationStrategy, useClass: HashLocationStrategy }],
  bootstrap: [AppComponent]
})
export class AppModule { }
