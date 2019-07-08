import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AppService } from '../services/app.service';
import { Popup } from '../../static/popup/Popup';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent {

  public username = '';
  public password = '';

  constructor(
    private router: Router,
    private appservice: AppService,
    private apiService: ApiService) {

  }

  public login(): void {
    this.apiService.login(this.username, this.password).subscribe(data => {
      this.appservice.setUser(data);
      this.appservice.initOnline();
      this.router.navigate(['']);
    }, error => Popup.error('Fehlerhafte Anmeldedaten'));
  }

}
