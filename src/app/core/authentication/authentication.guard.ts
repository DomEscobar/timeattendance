import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AppService } from '../../services/app.service';

@Injectable()
export class AuthenticationGuard implements CanActivate
{
  constructor(
    private router: Router,
    private appService: AppService) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean>
  {
    this.appService.isApp = window.hasOwnProperty('cordova');

    AppService.apiUrl = localStorage.getItem('APIURL');

    if (AppService.apiUrl != null && AppService.apiUrl !== '')
    {
      this.appService.isOnline = true;
      await this.appService.prepareApp();

      return this.appService.isAuthenticated();
    }

    await this.appService.prepareApp();

    return true;
  }

  private failed(state: RouterStateSnapshot): void
  {
    this.router.navigate(['/login'], { queryParams: { redirect: state.url }, replaceUrl: true });
  }
}
