import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { Attachment } from '../../model/profile/profile.model';

@Injectable({
  providedIn: 'root'
})
export class AttachmentUtility {

  private attachmentTemplate : Attachment = {
    crud: 2,
    account: 20,
    profile: 20,
    cover: 20,
    cloud: 10,
  }

  constructor() { }

  getTime(index : number = undefined){
    if( index ){
      return moment((new Date().getTime()+(index*1000))).format('YYYY-MM-DDTHH:mm:ss') + moment().format('ZZ');
    }
    return moment().format('YYYY-MM-DDTHH:mm:ss') + moment().format('ZZ');
  }


  mimeToMediaType(mime: string) {
    const suffix = mime.split('/')[0];
    const mimeMediaMap = {
      'video': 569,
      'pdf': 571,
      'image': 577,
      'file': 599,
      'audio': 587,
      'unknown': 601
    }

    // check for everything before file
    if( mime == 'image/svg+xml' ){
      return 599;
    }
    if (mimeMediaMap.hasOwnProperty(suffix)) {
      return mimeMediaMap[suffix];
    }
    else if (mime == 'application/x-mpegURL') { // One of the Iphone vedio Mime Type
      return mimeMediaMap.video;
    }
    else if (mime == 'application/pdf') { // for PDF
      return mimeMediaMap.pdf;
    }
    else if (suffix == 'application' || suffix == 'text') {
      return mimeMediaMap.file;
    }
    return mimeMediaMap.unknown;
  }

  fileToURL(file: File) :Promise<any>{
    return new Promise((resolve, reject) => {
      const temp = new FileReader();

      temp.onload = (ev) => {
        resolve(temp.result);
      }

      temp.onerror = (err) => {
        reject(err);
      }

      temp.readAsDataURL(file);
    })
  }


  getAttachmentMeta(userId: string, fileName: string, mimeType: string, size: number, additionalKeys: Object = {}, option: Array<string> = [], index: number = undefined){

    const currTime = this.getTime(index);
    const attachmentUID = uuid();
    // remove non ascii characters
    const asciiTest = new RegExp(/[^\x00-\x7F]/);
    if( asciiTest.test(fileName) ){
      fileName = `file.${fileName.split('.').pop()}`;
    }

    fileName = fileName.trim();
    
    const newAttObj : Attachment = {
      ...this.attachmentTemplate,
      time: currTime,
      last_update: currTime,
      owner: userId,
      size: size,
      title: fileName,
      mime_type: mimeType,
      attachment_id: attachmentUID,
      media_type: this.mimeToMediaType(mimeType),
      ...additionalKeys
    }

    for(let key of option){
      newAttObj[key] = 10;
      if( key == 'account' ){
        newAttObj['cloud'] = 20;
      }
    }

    return newAttObj;
  }

}
