import { Injectable, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, finalize, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { BaseService } from '../../services/baseService';
import { AppService } from '../../services/app.service';

const CST = 'cst';

/**
 * Authentication workflow.
 */
@Injectable()
export class AuthenticationService extends BaseService {


  private router: Router;
  private appService: AppService;
  private _token: string;
  private _user: User;

  constructor(injector: Injector) {
    super(injector);
    this.router = injector.get(Router);
    this.appService = injector.get(AppService);

    const token = sessionStorage.getItem(CST) || localStorage.getItem(CST);
    if (token) {
      this._token = token;
    }
  }

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  public initUserbyToken(): Observable<User> {
    return this.get('getUserByCst.php', `cst=${this.getToken()}`, false).pipe(map((response: any) => {
      return <User>response;
    }), tap((user) => {
      this.appService.setUser(user);
      this._user = user;
    }));
  }

  /**
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  public logout(): Observable<boolean> {
    // Customize credentials invalidation here
    this.setToken();
    this.router.navigate(['/login']);
    return of(true);
  }

  /**
   * Checks is the user is authenticated.
   * @return True if the user is authenticated.
   */
  public isAuthenticated(): boolean {
    return this._token != undefined;
  }


  /**
   * Gets the logged user.
   * @return The user  or null if the user is not authenticated.
   */
  public getLoggedUser(): User | null {
    return this._user;
  }

  public setUser(user: User): void {
    this._user = user;
  }

  /**
   * Sets the user token.
   * @param token The user token.
   * @param remember True to remember credentials across sessions.
   */
  public setToken(token?: string, remember?: boolean) {

    if (token) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(CST, token);
      this._token = token;
    } else {
      this._token = undefined;
      this._user = undefined;
      sessionStorage.removeItem(CST);
      localStorage.removeItem(CST);
    }
  }

  /**
   * Returns the authorization token
   *
   * @returns {string}
   */
  public getToken(): string {
    return this._token;
  }

}
