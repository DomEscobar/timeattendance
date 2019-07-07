import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AppService } from '../services/app.service';
import { AuthenticationService } from '../core/authentication/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent {

  public username = '';
  public password = '';

  constructor(
    private authenticationService : AuthenticationService,
    private apiService: ApiService) {

  }

  public login(): void {
    this.apiService.login(this.username, this.password).subscribe(data => {
      this.authenticationService.setToken(data.cst);
    });
  }

}
