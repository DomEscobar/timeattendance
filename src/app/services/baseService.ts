import { Component, Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
declare var unescape: any;
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import server from '../../assets/server.json';
import { Loading } from '../../static/loading/Loading';
import { Popup } from '../../static/popup/Popup';

export class BaseService {
    protected http: HttpClient;
    protected apiUrl = server.url;

    constructor(private injector: Injector) {
        this.http = this.injector.get(HttpClient);
    }

    /**
     * http Get
     * @param path
     * @param param
     */
    public get(path: string, param: any, isShowLoading: boolean = true): Observable<Response> {
        if (isShowLoading) {
            Loading.show();
        }
        const observer = this.http.get<Response>(this.apiUrl + path + '?' + param, {
        }).pipe(
            tap(
                data => {
                    if (isShowLoading) {
                        Loading.hide();
                    }
                },
                error => {
                    if (isShowLoading) {
                        Popup.error(error);
                    }
                }
            )
        );

        return observer;
    }

    /**
     * http post
     * @param path
     * @param param
     */
    public post(path: string, creds: any, isShowLoading: boolean = true): Observable<Response> {
        if (isShowLoading) {
            Loading.show();
        }
        const observer = this.http.post<Response>(this.apiUrl + path, creds, {
        }).pipe(
            tap(
                data => {
                    if (isShowLoading) {
                        Loading.hide();
                    }
                },
                error => Popup.error(error)
            )
        );

        return observer;
    }

    /**
   * http put
   * @param path
   * @param param
   */
    public put(path: string, param: any, creds: any): Observable<Response> {
        Loading.show();
        const observer = this.http.put<Response>(this.apiUrl + path + param, JSON.stringify(creds), {
        }).pipe(
            tap(
                data => Popup.success(),
                error => Popup.error(error)
            )
        );

        return observer;
    }

    delete(path: string, id: any = ''): Observable<any> {
        Loading.show();
        const observer = this.http.delete(this.apiUrl + path + '?id=' + id, {
        }).pipe(
            tap(
                data => Popup.success(),
                error => Popup.error(error)
            )
        );

        return observer;
    }



}
