import { Injectable } from '@angular/core';
import { BaseService } from '../../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class FileServiceService extends BaseService {
  public deleteAttachment(id){
		return this.httpDeleteWithHeader(`attachment/${id}`);
  }
}
