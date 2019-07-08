import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AppService } from '../services/app.service';
import { UserDetail } from '../models/userDetail';
import { User } from '../models/user';
import { UserDetailRelation } from '../models/userDetailRelation';
import { ApiService } from '../services/api.service';
declare const toastr: any;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less']
})
export class ProfileComponent implements OnInit {

  public user: User;
  public isDark: boolean;

  constructor(
    private apiService: ApiService,
    public appservice: AppService) {
  }

  async ngOnInit() {
    try {
      this.user = JSON.parse(JSON.stringify(this.appservice.getUser()));

      if (this.appservice.isOnline) {
        this.user = JSON.parse(JSON.stringify(this.appservice.getUser()));
        this.user.userDetails = await this.apiService.getUserDetailsByUserId(this.user.userid).toPromise();
      } else {
        this.appservice.user$.subscribe(data => {
        });
      }

      this.isDark = localStorage.getItem('isDark') === '1';
    } catch (e) {
      console.log(e);
    }
  }

  public save(): void {
    this.appservice.updateUser(this.user);
    toastr.success('Daten wurden im Cache gespeichert', 'Erfolgreich');
  }

  // -- Offline
  public addDetail(): void {
    const name = prompt("Name der zusaätzlichen Details", "Personalnummer");
    if (name == null) {
      return;
    }
    const newDetail = new UserDetail();
    newDetail.name = name;

    this.appservice.userDetails.push(newDetail);
  }

  //only Offline
  public deleteDetail(detail: UserDetailRelation): void {
    this.appservice.userDetails = this.user.userDetails.filter(o => o.userid !== detail.userid);
  }

  public setDark(isDark: boolean) {
    this.isDark = isDark;
    localStorage.setItem('isDark', isDark == true ? '1' : '0');
    (<HTMLLinkElement>document.getElementById('theme')).href = isDark ? 'assets/themes/dark.css' : 'assets/themes/white.css';
  }

  public setUserDetail(detailid: number, user: User, value): void {
    const detail = user.userDetails.find(o => Number(o.detailid) === Number(detailid));

    if (detail == null) {
      const newDetail = new UserDetailRelation();
      newDetail.detailid = Number(detailid);
      newDetail.userid = Number(user.userid);

      user.userDetails.push(newDetail);

      newDetail.value = value;
    }

    detail.value = value;
  }

  public getUserDetail(detailid: number, user: User): string {

    if (user.userDetails == null) {
      return '';
    }

    const detail = user.userDetails.find(o => Number(o.detailid) === Number(detailid));

    if (detail == null) {
      const newDetail = new UserDetailRelation();
      newDetail.detailid = Number(detailid);
      newDetail.userid = Number(user.userid);

      user.userDetails.push(newDetail);

      return newDetail.value;
    }

    return detail.value;
  }

}
