import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import moment from 'moment';
import { fromEvent, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { FileServiceService } from '../../../../core/services/general/files/file-service.service';
import { IconService } from '../../../../core/services/utility/icon.service';
import { Attachment } from '../../../../core/model/profile/profile.model'
import { cloneDeep } from 'lodash';
import { RestBoolean } from '../../../../core/model/restBoolean.model';

@Component({
  selector: 'kt-select-from-cloud',
  templateUrl: './select-from-cloud.component.html',
  styleUrls: ['./select-from-cloud.component.scss']
})
export class SelectFromCloudComponent implements OnInit {
  @Input() multiple = true;
  @Input() imageOnly = false;
  @Input() forAttachment = false;
  @Output() close = new EventEmitter<any>();
  loading = true;
  innerWidth = window.innerWidth;
  widthChange: Subscription;
  lastTime = (new Date()).getTime();
  currCount = 15;
  attachments:  Array<Attachment & {selected: any}> = [];
  initialLoad = false;
  lastCount = 0;
  loadMore = true;
  selectedFile : any;

  constructor(
    public cdr: ChangeDetectorRef,
    public iconService: IconService,
    private fileService: FileServiceService
  ) { }

  ngOnInit() {
    this.widthChange = fromEvent(window, 'resize').pipe(throttleTime(300)).subscribe(
      ev => {
        this.innerWidth = window.innerWidth;
        this.cdr.detectChanges();
        console.log(ev)
      }
    )

    this.fetchCloudAttachment();
  }

  fetchCloudAttachment() {
    let time_ = new Date().getTime().toString();
    if (this.lastTime != undefined) {
      time_ = (this.lastTime - 1).toString();
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.fileService.getFiles('attachment', time_, this.currCount.toString()).subscribe(
      response => {
        let attachmentsTemp = response['data']['attachment'];

        attachmentsTemp = attachmentsTemp.map(item => {
          item.original = item.original.replace('http://', 'https://');
          item['selected'] = false;
          item['_time'] = this.toUnix(item['time']);
          return item;
        })

        attachmentsTemp.sort((a, b) => {
          return a._time - b._time;
        })

        this.lastCount = attachmentsTemp.length;
        if (this.lastCount < this.currCount) {
          this.loadMore = false;
        }
        else {
          this.lastTime = attachmentsTemp[1]._time;
          attachmentsTemp.shift();
        }

        if( this.forAttachment ){
          attachmentsTemp = attachmentsTemp.filter(item => item.profile != RestBoolean.TRUE)
        }

        if( this.imageOnly ){
          attachmentsTemp = attachmentsTemp.filter(item => item.media_type == 577)
        }

        this.attachments.push(...(attachmentsTemp.reverse()));
        this.loading = false;
        this.initialLoad = true;
        this.cdr.detectChanges();
      },
      (err)=>{
        this.initialLoad = false;
        this.loading = false;
        console.error(err);
      }
    )
  }

  toUnix(dateString) {
    return moment(dateString).valueOf();
  }

  ifTablet(){
    return this.innerWidth <= 1024;
  }

  bytesToBigUnits(a, b = 2) {
    if (0 === a) return "0 Bytes";
    const c = 0 > b ? 0 : b,
      d = Math.floor(Math.log(a) / Math.log(1024));
    return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  }

  scrollDownHandle(){
    if( !this.loading && this.loadMore ){
      this.fetchCloudAttachment();
    }
  }

  select(){
    const selected = [];
    for(let file of this.attachments){
      if( file.selected ){
        selected.push(cloneDeep(file));
      }
    }
    this.close.emit(selected);
  }

  checked(obj: any){
    if( obj != this.selectedFile && !this.multiple){
      if( this.selectedFile ){
        this.selectedFile.selected = false;
      }
      this.selectedFile = obj;
    }
  }

  change(){
    setTimeout(()=>{
      this.cdr.detectChanges();
    },0)
  }

  isFileSelected(){
    return this.attachments.filter(file=>file.selected).length;
  }


  ngOnDestroy() {
    if (this.widthChange) {
      this.widthChange.unsubscribe();
    }
  }

}
