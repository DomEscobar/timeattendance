import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppService } from '../../services/app.service';

@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {
  constructor(private appservice: AppService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headersConfig = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const token = this.appservice.getUser();

    headersConfig['X-Authorization'] = token == null ? '' : token.cst;


    const request = req.clone({ setHeaders: headersConfig });
    return next.handle(request);
  }
}