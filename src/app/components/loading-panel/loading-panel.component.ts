import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-loading-panel',
  templateUrl: './loading-panel.component.html',
  styleUrls: ['./loading-panel.component.less']
})
export class LoadingPanelComponent implements OnInit {

  @Input()
  isVisible: boolean;

  constructor() { }

  ngOnInit() {
  }

}
