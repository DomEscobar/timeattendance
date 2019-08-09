import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { AppService } from '../services/app.service';
import { UserDetail } from '../models/userDetail';
import { User } from '../models/user';
import { UserDetailRelation } from '../models/userDetailRelation';
import { ApiService } from '../services/api.service';
declare const toastr: any;
import { File, IWriteOptions } from '@ionic-native/file/ngx';
import { Router } from '@angular/router';
import { Helper } from 'src/static/Helper';
import { VariablesService } from '../services/variables.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less']
})
export class ProfileComponent implements OnInit
{

  public user: User;
  public isDark: boolean;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private apiService: ApiService,
    private variablesService: VariablesService,
    public appservice: AppService)
  {
  }

  async ngOnInit()
  {
    try
    {
      this.ngZone.run(async () =>
      {
        this.user = JSON.parse(JSON.stringify(this.appservice.getUser()));
        await this.fetchUserDetails(this.user);
        this.isDark = localStorage.getItem('isDark') === '1';
      });
    } catch (e)
    {
      console.log(e);
    }
  }

  private async fetchUserDetails(user: User): Promise<void>
  {
    let currUserDetails = this.user.userDetails;
    let userDetails = this.appservice.userDetails;

    if (this.variablesService.isOnline)
    {
      userDetails = await this.apiService.getAllUserDetails().toPromise();
      if (currUserDetails == null)
      {
        currUserDetails = await this.apiService.getUserDetailsByUserId(user).toPromise();
      }
      currUserDetails = currUserDetails.map(o => new UserDetailRelation(o));
    }

    const details = [];

    if (userDetails == null)
    {
      return;
    }

    // fill details if not exists at user details
    userDetails.forEach(detail =>
    {
      if (currUserDetails.find(o => o.detailid == detail.detailid) != null)
      {
        details.push(currUserDetails.find(o => o.detailid == detail.detailid));
      } else
      {
        const newDetail = new UserDetailRelation();
        newDetail.detailid = detail.detailid;
        newDetail.userid = user.userid;
        details.push(newDetail);
      }
    });

    user.userDetails = details;
  }


  public save(): void
  {
    this.appservice.updateUser(this.user);
    toastr.success('Erfolgreich gespeichert', 'Erfolgreich');
  }

  // -- Offline
  public addDetail(): void
  {
    const name = prompt("Name der zusaätzlichen Details", "Personalnummer");
    if (name == null)
    {
      return;
    }
    const newDetail = new UserDetail();
    newDetail.name = name;

    this.appservice.addUserDetail(newDetail);
    this.fetchUserDetails(this.user);
  }

  //only Offline
  public deleteDetail(detail: UserDetailRelation): void
  {
    this.appservice.removeUserDetail(detail.detailid);
    this.fetchUserDetails(this.user);
  }

  public setDark(isDark: boolean)
  {
    this.isDark = isDark;
    localStorage.setItem('isDark', isDark == true ? '1' : '0');
    (<HTMLLinkElement>document.getElementById('theme')).href = isDark ? 'assets/themes/dark.css' : 'assets/themes/white.css';
  }

  public connect(): void
  {
    const url = window.prompt('Bitte Server URL der API eingeben');

    if (url == null)
    {
      return;
    }

    if (confirm('Änderungen und Stempelungen gehen dabei verloren, sind Sie sich sicher?'))
    {
      localStorage.setItem('APIURL', url);
      this.variablesService.isOnline = true;
      this.variablesService.apiUrl = url;
      this.appservice.logout();
      this.router.navigate(['login']);
    }
  }
}
