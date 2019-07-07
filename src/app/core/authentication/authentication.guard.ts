import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AppService } from '../../services/app.service';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(private router: Router,
    private appService: AppService,
    private authenticationService: AuthenticationService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {

    if (!this.appService.isOnline) {
      return;
    }

    if (this.authenticationService.isAuthenticated()) {
      if (!this.authenticationService.getLoggedUser()) {
        return this.authenticationService.initUserbyToken().pipe(map((user) => {
          if (user) {
            return true;
          }
          this.failed(state);
          return false;
        }));
      } else {
        return true;
      }
    } else {
      this.failed(state);
      return false;
    }
  }

  private failed(state: RouterStateSnapshot): void {
    this.authenticationService.logout();
    this.router.navigate(['/login'], { queryParams: { redirect: state.url }, replaceUrl: true });
  }
}
