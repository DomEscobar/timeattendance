import { ElementRef, Directive, Output, Input, OnInit, EventEmitter, Component, ViewChild } from '@angular/core';
import moment from 'moment';
declare const $: any;

@Component({
  selector: 'acc-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.css']
})
/**
 * Air datepicker
 * http://t1m0n.name/air-datepicker/docs/
 * */
export class DatepickerComponent implements OnInit {
  picker: any;
  _isRange = false;
  _value: Date = new Date();
  _maxDate: Date = new Date('2220/2/14');
  _minDate: Date = new Date('1920/2/14');

  @ViewChild('datepicker')
  datepicker: ElementRef;

  @Input()
  title = 'date';

  @Output() valueChange: EventEmitter<Date> = new EventEmitter();

  @Input()
  hasNull = false;

  // if pciker has timepicker
  @Input()
  hasTime;

  @Input()
  set value(date: Date) {
    date = new Date(date);
    if (date == null || isNaN(date.getTime()) || this.checkDate(date) || !moment(date).isValid()) {
      if (this.hasNull) {
        this.setAsNull();
      }

      return;
    }

    this.dateDataStr = moment(date).format(this.getMomentFormat());
  }

  @Input() dateFormat = 'dd.mm.yyyy';

  @Input()
  set maxDate(date: Date) {
    this._maxDate = date;

    if (this.picker != null) {
      this.picker.update('maxDate', date);
    }
  }

  @Input()
  set minDate(date: Date) {
    this._minDate = date;

    if (this.picker != null) {
      this.picker.update('minDate', date);
    }
  }

  @Input()
  set range(
    isRange: boolean // TODO : Votum ob das okey ist als rangepic UX
  ) {
    this._isRange = isRange;
    this.initPicker();
  }

  @Input()
  position = 'bottom left';

  @Input()
  classes = '';

  dateDataStr = '';

  constructor() {}

  ngOnInit() {
    this.initPicker();
  }

  initPicker() {
    const opts = {
      timepicker: this.hasTime,
      classes: this.classes,
      position: this.position,
      dateFormat: this.dateFormat,
      startDate: this._value,
      clearButton: this.hasNull,
      minDate: this._minDate,
      maxDate: this._maxDate,
      range: this._isRange,
      todayButton: new Date(),
      multipleDatesSeparator: ' - ',
      toggleSelected: false, // can select same dates in range
      onSelect: (formattedDate, date, inst) => {
        // posibility to create null dates
        if (this.hasNull && date == null) {
          this.dateDataStr = '';
          this.valueChange.emit(null);
          return;
        }

        if (!this._isRange) {
          const dateData = moment(formattedDate, this.getMomentFormat()).toDate();
          this.dateDataStr = formattedDate;
          this.valueChange.emit(dateData);
        }
      },
      onHide: (inst, animationCompleted) => {
        this.picker = null;
      }
    };

    const $input = $(this.datepicker.nativeElement).datepicker(opts);
    this.picker = $(this.datepicker.nativeElement).data('datepicker');
  }

  private getMomentFormat() {
    return this.dateFormat.toUpperCase() + (this.hasTime ? ' HH:mm' : '');
  }

  openPicker(event: Event) {
    if (this.picker == null) {
      this.initPicker();
    }

    this.picker.show();
    event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
  }

  onInputChange() {
    const dateData = moment(this.dateDataStr, this.getMomentFormat()).toDate();

    if (this.checkDate(dateData) || isNaN(dateData.getTime())) {
      if (this.hasNull) {
        this.setAsNull();
        this.valueChange.emit(dateData);
        return;
      }

      this.dateDataStr = moment(this._value).format(this.getMomentFormat());
      return;
    }

    this.setPickerDate(dateData);
    this.valueChange.emit(dateData);
  }

  private setPickerDate(date: Date) {
    if (this.picker != null) {
      this.picker.selectDate(date);
    }

    this._value = date;
  }

  private checkDate(date: Date): boolean {
    return moment(date).isBefore(this._minDate) || moment(date).isAfter(this._maxDate);
  }

  // If value can be null we set an empty input
  private setAsNull() {
    this._value = null;
    this.dateDataStr = '';
  }
}
