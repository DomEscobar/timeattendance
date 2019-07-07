import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AppService } from '../../services/app.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(private router: Router,
    private appService: AppService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {

    if (!this.appService.isOnline) {
      return true;
    }

    if (this.appService.isAuthenticated()) {
      return true;
    } else {
      this.failed(state);
      return false;
    }
  }

  private failed(state: RouterStateSnapshot): void {
    this.router.navigate(['/login'], { queryParams: { redirect: state.url }, replaceUrl: true });
  }
}
