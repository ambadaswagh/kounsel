import { Injectable } from '@angular/core';
// import * as AWS from 'aws-sdk/global';
import { CognitoIdentityCredentials, config, AWSError } from 'aws-sdk/global'
import * as S3 from 'aws-sdk/clients/s3';
import { environment } from '../../../../environments/environment';
import {  BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import * as moment from 'moment';
import { FireBaseUserService } from '../user/fire-base-user.service';

@Injectable({
  providedIn: 'root'
})
export class AWSService {

  constructor(private userService: FireBaseUserService) { }

  public setConfig(){
    config.update({
      region: environment.awsConfig.COGNITO_REGION,
      credentials: new CognitoIdentityCredentials({
        IdentityPoolId: environment.awsConfig.IDENTITY_POOL_ID
      })
    });
  }

  getBucket(){
    const s3Bucket = new S3({
      apiVersion: '2006-03-01',
      params: {
        Bucket: environment.awsConfig.BUCKET_NAME
      },
      region: environment.awsConfig.BUCKET_REGION
    })
    return s3Bucket;
  }

  private generateKeyForCover(userId: string, fileName: string) : string{
    return `${userId}/${uuid().substr(0, 8)}__${fileName}`;
  }

  public cancelUpload(managedUpload: S3.ManagedUpload){
    managedUpload.abort();
  }

  public downloadAttachment(key, name){
    this.setConfig();
    const s3Bucket = this.getBucket();
    return s3Bucket.getObject({
      Bucket: environment.awsConfig.BUCKET_NAME,
      Key: key
    });
  }

  public getUploadStatus(managedUpload: S3.ManagedUpload) : Observable<number> {
    const status = new BehaviorSubject<number>(0);

    managedUpload.on('httpUploadProgress', (progress) => {

      status.next( (progress.loaded / progress.total) * 100 );

      if( progress.loaded === progress.total ){
        status.complete();
      }
    })

    return status.asObservable();
  }

  public getDownloadProgress(managedDownload){
    const status = new BehaviorSubject<number>(0);

    managedDownload.on('httpDownloadProgress', (progress) => {
      status.next( (progress.loaded / progress.total) * 100 );

      if( progress.loaded === progress.total ){
        status.complete();
      }
    })

    return status.asObservable();
  }

  upload(file, metaData, fileName, userId){
    const s3Bucket = this.getBucket();
    fileName = `${uuid()}.${fileName.split('.').pop()}`
    const s3ManagedUploadObj = s3Bucket.upload({
      Key: this.generateKeyForCover(userId, fileName),
      Bucket: environment.awsConfig.BUCKET_NAME,
      Body: file,
      ContentType: file.type,
      Metadata: {
        envelope2user : JSON.stringify(metaData)
      }
    })

    return s3ManagedUploadObj;
  }
}
