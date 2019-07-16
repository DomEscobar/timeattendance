import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
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
    private ngZone: NgZone,
    private apiService: ApiService,
    public appservice: AppService) {
  }

  async ngOnInit() {
    try {
      this.ngZone.run(async () => {
        this.user = JSON.parse(JSON.stringify(this.appservice.getUser()));
        await this.fetchUserDetails(this.user);
        this.isDark = localStorage.getItem('isDark') === '1';
      });
    } catch (e) {
      console.log(e);
    }
  }

  private async fetchUserDetails(user: User): Promise<void> {

    const userDetails = await this.apiService.getAllUserDetails().toPromise();


    let currUserDetails = user.userDetails;


    if (this.appservice.isOnline) {
      if (currUserDetails == null) {
        currUserDetails = await this.apiService.getUserDetailsByUserId(user).toPromise();
      }
      currUserDetails = currUserDetails.map(o => new UserDetailRelation(o));
    }

    const details = [];
    // fill details if not exists at user details
    userDetails.forEach(detail => {
      if (currUserDetails.find(o => Number(o.detailid) == Number(detail.detailid)) != null) {
        details.push(currUserDetails.find(o => Number(o.detailid) == Number(detail.detailid)));
      } else {
        const newDetail = new UserDetailRelation();
        newDetail.detailid = Number(detail.detailid);
        newDetail.userid = Number(user.userid);
        details.push(newDetail);
      }
    });

    user.userDetails = details;
  }


  public save(): void {
    this.appservice.updateUser(this.user);
    toastr.success('Erfolgreich gespeichert', 'Erfolgreich');
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
}
