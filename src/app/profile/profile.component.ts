import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AppService } from '../services/app.service';
declare const toastr: any;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less']
})
export class ProfileComponent implements AfterViewInit {

  public onSignatureClear: boolean;

  constructor(public appservice: AppService) { }

  ngAfterViewInit() {
  }

  public save(): void {
    this.appservice.getSignature.next('');
    this.appservice.updateUser();
    toastr.success('Daten wurden im Cache gespeichert', 'Erfolgreich');
  }

  public newSignature(): void {
    this.onSignatureClear = !this.onSignatureClear;
  }
}
