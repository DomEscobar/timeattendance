import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { VariablesService } from '../../services/variables.service';
import { AppService } from '../../services/app.service';

@Injectable()
export class AuthenticationGuard implements CanActivate
{
  constructor(
    private router: Router,
    private appService: AppService,
    private variablesService: VariablesService) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean>
  {
    this.variablesService.isApp = window.hasOwnProperty('cordova');

    this.variablesService.apiUrl = localStorage.getItem('APIURL');

    if (this.variablesService.apiUrl != null && this.variablesService.apiUrl !== '')
    {
      this.variablesService.isOnline = true;
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
