import { Directive, AfterViewInit, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { AppService } from '../services/app.service';
declare const SignaturePad: any;

@Directive({
  selector: '[appSignaturePad]'
})
export class SignaturePadDirective implements AfterViewInit {

  private signaturePad;

  @Input()
  set onClear(clear) {
    if (clear == null) {
      return;
    }
    this.signaturePad.clear();
  }

  constructor(
    private appService: AppService,
    private elementRef: ElementRef) {
    this.appService.getSignature$.subscribe(data => {
      if (data == null) {
        return;
      }
      this.appService.getUser().signature = this.signaturePad.toDataURL();
    });
  }

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.elementRef.nativeElement);

    if (this.appService.getUser().signature) {
      this.signaturePad.fromDataURL(this.appService.getUser().signature);
    }
  }

}
