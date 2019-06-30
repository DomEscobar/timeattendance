import {
  Component, Input, Output,
  EventEmitter, OnChanges, DoCheck, KeyValueDifferFactory,
  KeyValueDiffers, KeyValueDiffer
} from '@angular/core';

@Component({
  selector: 'app-save-panel',
  templateUrl: './save-panel.component.html',
  styleUrls: ['./save-panel.component.css']
})
export class SavePanelComponent implements DoCheck {
  showPreview = false;

  @Input()
  withPreview = false;

  @Input()
  isOpen = false;

  @Output()
  isOpenChange: EventEmitter<boolean> = new EventEmitter;


  objectBeforeSave;
  currObject;
  differ: KeyValueDiffer<any, any>;
  changedProperties: ChangedProperty[] = new Array();

  @Input()
  ignoreProperties: string[] = new Array();

  @Input()
  set objectToSave(obj) {
    this.objectBeforeSave = this.deepCopy(obj);
    this.currObject = obj;

    if (this.withPreview) {
      this.differ = this.keyValueDiffers.find(this.objectToSave).create();
    }
  }

  get objectToSave() {
    return this.currObject;
  }

  @Output()
  onCancel: EventEmitter<any> = new EventEmitter();

  @Output()
  onSave: EventEmitter<any> = new EventEmitter();

  constructor(private keyValueDiffers: KeyValueDiffers) { }

  ngDoCheck() {
    const before = JSON.stringify(this.removeIgnoreProperty(this.objectBeforeSave));
    const after = JSON.stringify(this.removeIgnoreProperty(this.objectToSave));

    this.isOpen = !(before === after);

  }

  save() {
    this.objectBeforeSave = this.deepCopy(this.objectToSave);
    this.onSave.emit(this.objectToSave);

    this.closeAndReset();
  }

  cancel() {
    this.onCancel.emit(this.objectBeforeSave);
    this.closeAndReset();
  }

  private closeAndReset() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.changedProperties = [];
  }

  // We don't want some properties to be tracked
  private removeIgnoreProperty(obj) {
    if (obj == null) {
      return obj;
    }

    const copy = this.deepCopy(obj);

    this.ignoreProperties.forEach((prop) => {
      if (copy instanceof Array) {
        const arr: any[] = copy;

        arr.forEach((singleObj) => {
          singleObj[prop] = null;
        });
      } else {
        copy[prop] = null;
      }

    });

    return copy;
  }

  private deepCopy(oldObj: any) {
    let newObj = oldObj;
    if (oldObj && oldObj instanceof Object) {
      newObj = Object.prototype.toString.call(oldObj) === "[object Array]" ? [] : {};

      for (const i of Object.keys(oldObj)) {
        newObj[i] = this.deepCopy(oldObj[i]);
      }
    }
    return newObj;
  }

  showprev() {
    this.showPreview = !this.showPreview;
  }

}

export class ChangedProperty {
  constructor(public key, public before, public after) {
  }
}
