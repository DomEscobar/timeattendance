import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  constructor() {
    const darkTheme = localStorage.getItem('isDark');
    (<HTMLLinkElement>document.getElementById('theme')).href = darkTheme == '1' ? 'assets/themes/dark.css' : 'assets/themes/white.css';

  }
}
