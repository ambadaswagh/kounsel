import { Component, OnInit, Input, Output, EventEmitter, HostListener, ChangeDetectorRef } from '@angular/core';
import { buffer, debounceTime, map, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface MainMenu {
  name: string,
  items: Array<SubMenu>,
  opened: boolean
}

export interface SubMenu {
  name: string,
  items: Array<Menu>,
  opened: boolean
}

export interface Menu {
  name: string,
  selected: boolean;
}


export interface _Menu {
  name: string,
  items: Array<_Menu>,
  opened: boolean,
  selected?: boolean
}

@Component({
  selector: 'kt-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {
  @Input() title: string;
  @Input() data: Promise<any>;
  @Input() selectedValue: any;
  @Output() close = new EventEmitter<any>();
  @Output() closeWihoutSave = new EventEmitter<any>();

  _oldValue = '';

  _metaData: _Menu[] = [];

  metaData: Array<MainMenu> = [];
  updatedValue: string = '';
  innerWidth: number;
  loading = true;

  // Double click for Touch devices
  click$ = new Subject<any>();
  doubleClick$ = this.click$.pipe(
    buffer(this.click$.pipe(debounceTime(200))),
    map(list => ({ length: list.length, id: list[list.length - 1] })),
    filter(item => item.length === 2),
    map(item => item.id)
  );

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {

    this.doubleClick$.subscribe(data => {
      this.doubleClick(data);
    })

    this.innerWidth = window.innerWidth;
    this._oldValue = this.selectedValue;

    this.data.then(data => {
      this.loading = false;
      this.makeMenuModel(data, this._metaData, '');
      this.openSelected(this._metaData);
      this.cdr.detectChanges();
    }).catch(err => {
      console.log(err);
    })

  }

  makeMenuModel(obj, arr: Array<_Menu>, prev: string) {
    const keys = Object.keys(obj);
    for (let key of keys) {
      const temp: _Menu = {
        name: key,
        items: [],
        opened: false,
      }
      if (typeof obj[key] !== 'string') {
        this.makeMenuModel(obj[key], temp.items, key);
      }
      else {
        temp.selected = (temp.name.toUpperCase() === this.selectedValue.toUpperCase());
      }
      if (key.toUpperCase() != prev.toUpperCase() || keys.length == 1) {
        arr.push(temp);
      }
    }
  }

  clearAllSelection(arr: Array<_Menu>) {
    for (let item of arr) {
      item.selected = false;
      if (item.items.length > 0) {
        this.clearAllSelection(item.items);
      }
    }
  }

  itemClicked(item: _Menu) {
    this.click$.next(item);
    if (item.items.length > 0) {
      item.opened = !item.opened;
    }
    else {
      this.clearAllSelection(this._metaData);
      this.selectedValue = item.name;
      item.selected = true;
    }
  }

  doubleClick(item: _Menu) {
    if (item.items.length > 0) {
      item.opened = !item.opened;
    }
    else {
      this.clearAllSelection(this._metaData);
      this.selectedValue = item.name;
      item.selected = true;
      this._save();
    }
  }

  _save() {
    this.close.emit(this.selectedValue);
  }

  openSelected(arr: Array<_Menu>) {
    let flag = false;
    for (let item of arr) {
      if (item.selected) {
        return true;
      }
      item.opened = this.openSelected(item.items);
      flag = flag || item.opened;
    }
    return flag;
  }

  _close() {
    this.closeWihoutSave.emit()
  }

}
