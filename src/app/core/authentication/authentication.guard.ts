import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AppService } from '../../services/app.service';
import { HttpClient } from '@angular/common/http';
import { File } from '@ionic-native/file/ngx';
import * as cfg from '../../../assets/server.json';

@Injectable()
export class AuthenticationGuard implements CanActivate
{
  constructor(
    private file: File,
    private http: HttpClient,
    private router: Router,
    private appService: AppService) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean>
  {
    this.appService.isApp = window.hasOwnProperty('cordova');

    if (this.appService.isApp)
    {
      const opt = await this.http.get<any>(this.file.dataDirectory + '/server.json').toPromise();

      // --- Online app
      if (opt != null)
      {
        AppService.apiUrl = opt.cfg;
        this.appService.isOnline = true;
        await this.appService.prepareApp();

        return this.appService.isAuthenticated();
      }

      // offline app
      return true;
    }       
    
    /**
     * ---- Check as web app
     */
    AppService.apiUrl = cfg.url;
    this.appService.isOnline = cfg.url != '';
    await this.appService.prepareApp();

    if (!this.appService.isOnline)
    {
      return true;
    }

    if (this.appService.isAuthenticated())
    {
      return true;
    } else
    {
      this.failed(state);
      return false;
    }
  }

  private failed(state: RouterStateSnapshot): void
  {
    this.router.navigate(['/login'], { queryParams: { redirect: state.url }, replaceUrl: true });
  }
}
