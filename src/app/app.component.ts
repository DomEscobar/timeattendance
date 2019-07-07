import { Component } from '@angular/core';
import { AppService } from './services/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  public isPreloading: boolean = true;

  constructor(public appService : AppService) {
    const darkTheme = localStorage.getItem('isDark');
    (<HTMLLinkElement>document.getElementById('theme')).href = darkTheme == '1' ? 'assets/themes/dark.css' : 'assets/themes/white.css';

    setTimeout(() => {
      this.isPreloading = false;
    }, 2000);
  }
}
