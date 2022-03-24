import { Injectable } from '@angular/core';
import { Attachment } from '../../model/profile/profile.model';


@Injectable({
  providedIn: 'root'
})
export class IconService {
  private mediaTypeToIconMap = {
    '569': 'video-file-video-1.svg',
    '571': 'office-file-pdf-1-1.svg',
    '599': {
      'excel': 'office-file-xls-1-1.svg',
      'doc': 'doc.svg',
      'ppt': 'office-file-presentation-1-1.svg',
      'txt': 'office-file-txt-1-1.svg',
      'default': 'description-black-18dp.svg',
      'zip': 'file-zip-1.svg',
      'ai': 'design-file-ai-1-1.svg',
      'apk': 'file-apk-1.svg',
      'asp': 'file-asp-1.svg',
      'cpp': 'file-c-plus-plus-1.svg',
      'css': 'file-css-1.svg',
      'csv': 'file-csv-1.svg',
      'eps': 'image-file-eps-1.svg',
      'exe': 'file-exe-1.svg',
      'html': 'file-html-1.svg',
      'java': 'file-java-1.svg',
      'key': 'office-file-key-1-1.svg',
      'php': 'file-php-1.svg',
      'psd': 'design-file-psd-1-1.svg',
      'rar': 'file-rar-1.svg',
      'ttf': 'design-file-ttf-1-1.svg',
      '3ds': 'design-file-3-ds-1-1.svg'
    },
    '587': 'audio-file-1.svg',
    '593': 'youtube-social-icon-red@2x.png',
    '601': 'description-black-18dp.svg'
  }

  private excelMimeSet = new Set(['application/vnd.ms-excel', 'application/vnd.ms-excel', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.spreadsheetml.template', 'application/vnd.ms-excel.sheet.macroEnabled.12', 'application/vnd.ms-excel.template.macroEnabled.12', 'application/vnd.ms-excel.addin.macroEnabled.12', 'application/vnd.ms-excel.sheet.binary.macroEnabled.12']);
  private docMimeSet = new Set(['application/msword', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.wordprocessingml.template', 'application/vnd.ms-word.document.macroEnabled.12', 'application/vnd.ms-word.template.macroEnabled.12']);
  private pptMimeType = new Set(['application/vnd.ms-powerpoint', 'application/vnd.ms-powerpoint', 'application/vnd.ms-powerpoint', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.presentationml.template', 'application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'application/vnd.ms-powerpoint.addin.macroEnabled.12', 'application/vnd.ms-powerpoint.presentation.macroEnabled.12', 'application/vnd.ms-powerpoint.template.macroEnabled.12', 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12']);

  constructor() { }

  getIconForAttachment(attachment: Attachment): string {
    const key = this.getFileTypeKey(attachment.mime_type, attachment.title);

    if( key == 'svg' ) return `assets/media/icons/filetype/image-file-svg-1.svg`
    switch (attachment.media_type) {
      case 569:
        return this.getPathString(this.mediaTypeToIconMap['569']);
      case 571:
        return this.getPathString(this.mediaTypeToIconMap['571']);
      case 587:
        return this.getPathString(this.mediaTypeToIconMap['587']);
      case 593:
        return this.getPathString(this.mediaTypeToIconMap['593']);
      case 599:
        if( this.mediaTypeToIconMap['599'].hasOwnProperty(key) ){
          return `assets/media/icons/filetype/${this.mediaTypeToIconMap['599'][key]}`
        }
        return `assets/media/icons/filetype/${this.mediaTypeToIconMap['599']['default']}`
      default:
        if( this.mediaTypeToIconMap['599'].hasOwnProperty(key) ){
          return `assets/media/icons/filetype/${this.mediaTypeToIconMap['599'][key]}`
        }
        return this.getPathString(this.mediaTypeToIconMap['601']);
    }
  }

  private getPathString(name) {
    return `assets/media/icons/filetype/${name}`;
  }

  private getFileTypeKey(mimeType, filename) {
    const key = filename.split('.').pop();
    if( key == 'csv' ) return 'csv';
    else if (this.excelMimeSet.has(mimeType)) return 'excel';
    else if (this.docMimeSet.has(mimeType)) return 'doc';
    else if (this.pptMimeType.has(mimeType)) return 'ppt';

    return key;
  }
}