import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.less']
})
export class SelectComponent implements OnInit {

  public showOptions: boolean;

  @Input()
  property: string = 'name';

  @Input()
  public title = '';

  @Input()
  public options: any[] = new Array();

  @Input()
  selected: any;

  @Output()
  selectedChange: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() { }

  public select(opt: any): void {
    this.showOptions = false;
    this.selectedChange.emit(opt);
  }
}
