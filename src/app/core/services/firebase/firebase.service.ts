import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUtility {

  constructor(public fireStore: AngularFirestore) { }

  addDataToCollection(path, data){
    const collectionReference = this.fireStore.collection(path);
    return collectionReference.add(data);
  }

  getDocument(path){
    return this.fireStore.doc<any>(path).valueChanges().pipe(take(1));
  }

}
