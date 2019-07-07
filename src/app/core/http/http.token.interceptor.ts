import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppService } from '../../services/app.service';
import { User } from '../../models/user';

@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {
  constructor(private appservice: AppService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headersConfig = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const user = localStorage.getItem(AppService.USER);
    let userEncrypt;

    if (user != null) {
      userEncrypt = new User(JSON.parse(window.atob(user)));
    }

    headersConfig['X-Authorization'] = userEncrypt == null ? '' : userEncrypt.cst;

    const request = req.clone({ setHeaders: headersConfig });
    return next.handle(request);
  }
}