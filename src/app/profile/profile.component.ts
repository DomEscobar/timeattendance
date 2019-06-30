import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AppService } from '../services/app.service';
import { UserDetail } from '../models/userDetail';
import { User } from '../models/user';
declare const toastr: any;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less']
})
export class ProfileComponent implements AfterViewInit {

  public onSignatureClear: boolean;
  public user: User;
  public isDark: boolean;

  constructor(public appservice: AppService) {
    this.appservice.user$.subscribe(data => {
      this.user = JSON.parse(JSON.stringify(data));
    });

    this.isDark = localStorage.getItem('isDark') === '1';
  }

  ngAfterViewInit() {
  }

  public save(): void {
    this.appservice.getSignature.next('');
    this.appservice.updateUser(this.user);
    toastr.success('Daten wurden im Cache gespeichert', 'Erfolgreich');
  }

  public newSignature(): void {
    this.onSignatureClear = !this.onSignatureClear;
  }

  public addDetail(): void {
    const name = prompt("Name der zusaätzlichen Details", "Personalnummer");
    if (name == null) {
      return;
    }
    const newDetail = new UserDetail();
    newDetail.name = name;

    this.user.userDetails.push(newDetail);
  }

  public deleteDetail(detail: UserDetail): void {
    this.user.userDetails = this.user.userDetails.filter(o => o.guid !== detail.guid);
  }

  public setDark(isDark: boolean) {
    this.isDark = isDark;
    localStorage.setItem('isDark', isDark == true ? '1' : '0');
    (<HTMLLinkElement>document.getElementById('theme')).href = isDark ? 'assets/themes/dark.css' : 'assets/themes/white.css';
  }

}
