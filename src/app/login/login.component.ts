import { Component, OnInit, AfterContentInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AppService } from '../services/app.service';
import { Popup } from '../../static/popup/Popup';
import { Router } from '@angular/router';
import { NFC } from '@ionic-native/nfc/ngx';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements AfterContentInit {

  public ndefListener;
  public defFormatableListener;

  public username = '';
  public password = '';

  constructor(
    private nfc: NFC,
    private router: Router,
    private appservice: AppService,
    private apiService: ApiService) {
    document.addEventListener('deviceready', () => {
      this.checkNFC();
    });
  }

  ngAfterContentInit() {
  }

  public login(): void {
    this.apiService.login(this.username, this.password).subscribe(data => {
      this.appservice.setUser(data);
      this.appservice.initOnline();
      this.router.navigate(['']);
    }, error => Popup.error('Fehlerhafte Anmeldedaten'));
  }

  public checkNFC(): void {
    this.nfc.enabled().then(() => {
      this.listenNFC();
    });
  }

  public listenNFC(): void {
    this.ndefListener = this.nfc.addNdefListener(() => {
    }, (err) => {
      console.log('error attaching ndef listener', err);
    }).subscribe((event) => {

      this.password = this.nfc.bytesToHexString(event.tag.id);
      this.loginNFC();
      this.disableListeners();
    });

    this.defFormatableListener = this.nfc.addNdefFormatableListener(() => {
    }, (err) => {
      console.log('error attaching ndef listener', err);
    }).subscribe((event) => {

      this.password = this.nfc.bytesToHexString(event.tag.id);
      this.loginNFC();
      this.disableListeners();
    });
  }

  private loginNFC(): void {
    this.apiService.loginNFC(this.password).subscribe(data => {
      this.appservice.setUser(data);
      this.appservice.initOnline();
      this.router.navigate(['']);
    }, error => Popup.error('ID nicht vorhanden'));
  }

  private disableListeners(): void {
    this.ndefListener.unsubscribe();
    this.defFormatableListener.unsubscribe();
  }

}
