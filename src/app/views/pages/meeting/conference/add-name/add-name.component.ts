import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'kt-add-name',
  templateUrl: './add-name.component.html',
  styleUrls: ['./add-name.component.scss']
})
export class AddNameComponent implements OnInit {
  @Input() name;
  @Output() $name = new EventEmitter<any>();
  constructor(
    private cdr: ChangeDetectorRef,
    public translateService: TranslateService
  ) { }

  ngOnInit() {
  }

  ngOnViewInit(){}

  isValid(){
    if( !this.name || this.name.match(/^\s*$/) ){
      return false;
    }
    return true;
  }

  continue(){
    this.$name.emit(this.name)
  }

}
