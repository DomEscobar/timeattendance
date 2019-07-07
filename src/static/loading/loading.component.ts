import { Component, OnInit, ElementRef } from '@angular/core';
import { Loading } from '../loading/Loading';

@Component({
  selector: 'acc-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent {

  isLoading = false;

  constructor(private elementRef: ElementRef) {
    Loading.onLoad.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
  }

  private hide() {
    this.isLoading = false;
  }
}
