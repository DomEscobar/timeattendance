import { Directive, Input, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appModal]'
})
export class ModalDirective implements AfterViewInit {

  private element: HTMLElement;

  @Input()
  set visible(isVisible: any) {

    if (this.element == null) {
      return;
    }

    this.element.style.display = isVisible != null ? 'block' : 'none';
  }

  constructor(private elementRef: ElementRef) { }
  ngAfterViewInit(): void {
    this.element = this.elementRef.nativeElement;
    this.element.style.display = 'none';

  }
}
