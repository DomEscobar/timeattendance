import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
import moment from 'moment';
declare const $: any;

@Component({
  selector: 'app-time-input',
  templateUrl: './time-input.component.html',
  styleUrls: ['./time-input.component.css']
})
export class TimeInputComponent implements AfterViewInit {
  @ViewChild('timeInput')
  timeInput: ElementRef;

  inputValue: string = '';

  _value;

  private timepicker;

  @Input()
  set value(value: string) {
    if (value == null) {
      return;
    }

    this._value = value;
    this.inputValue = value;

    this.inputNormalToDate(false);
  }

  get value(): string {
    return this._value;
  }

  @Output()
  valueChange: EventEmitter<string> = new EventEmitter();

  constructor() {
  }

  ngAfterViewInit() {
    $(this.timeInput.nativeElement).click((e) => {
      this.timeInput.nativeElement.setSelectionRange(0, this.timeInput.nativeElement.value.length);
    });
  }

  inputChange(isPickerHide = false) {
    if (!isPickerHide && this.timepicker != null) {
      this.timepicker.close();
    }

    if (this.inputValue == null) {
      return;
    }

    // avoid alphabet letter
    if (this.inputValue.match(/[a-z]/i)) {
      this.inputValue = '00:00';
      return;
    }

    this.inputNormalToDate();
  }

  private inputNormalToDate(inputChanged = true) {
    this.inputValue = moment(this.inputValue, 'HH:mm').format('HH:mm');

    if (inputChanged) {
      // transfer it
      this.valueChange.emit(this.inputValue);
    }
  }
}
