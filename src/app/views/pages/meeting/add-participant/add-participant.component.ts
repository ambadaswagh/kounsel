import { Component, OnInit, EventEmitter, ChangeDetectorRef, Output, Input, ViewChild } from '@angular/core';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { ParticipantType } from '../../../../core/model/meeting/Participant.model';
import { MeetingService } from '../../../../core/services/general/meeting/meeting.service';
import { BillingType } from '../../../../core/model/meeting/billing.model';
import { meetingAccessPOSTResponse } from '../../../../core/model/meeting/meeting.model';
import { BillingMethodComponent } from '../billing-method/billing-method.component';
import { MatSnackBar } from '@angular/material';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'kt-add-participant',
  templateUrl: './add-participant.component.html',
  styleUrls: ['./add-participant.component.scss']
})
export class AddParticipantComponent implements OnInit {
  @ViewChild('billing') billingComp: BillingMethodComponent;
  @Output() $back = new EventEmitter<any>();
  @Output() $displayParticipantDetail = new EventEmitter<any>();
  @Output() $selectBilling = new EventEmitter<any>();
  selectedUserType: ParticipantType = ParticipantType.NONE;
  displayBillingMethod = false;
  billingInfo;
  addingParticipant = false;


  constructor(
    public cdr: ChangeDetectorRef,
    public meeting: MeetingService,
    private _snackBar: MatSnackBar,
    public translateService: TranslateService
  ) { }

  ngOnInit() {
  }

  back() {
    this.$back.emit();
  }

  noBillingSelected() {
    this.displayBillingMethod = false;
  }

  billingMethodSelected(billingData) {
    this.billingInfo = billingData;
    this.getAccess(this.getPayloadForClient());
    this.cdr.detectChanges();
  }

  validAddParticipants() {
    if (this.selectedUserType == ParticipantType.GUEST || this.selectedUserType == ParticipantType.CLIENT) {
      return true;
    }
    return false;
  }

  addParticipant() {
    switch (this.selectedUserType) {
      case ParticipantType.CLIENT:
        this.$selectBilling.emit();
        break;
      case ParticipantType.GUEST:
        this.getAccess(this.getPayloadForGuest());
        break;
      default:
        break;
    }
  }

  getPayloadForClient(){
    const payload = {
      meeting:{
        client: ParticipantType.CLIENT,
        billing_type: this.billingInfo.billing_type
      }
    }

    if( this.billingInfo.billing_type == BillingType.FIXED ){
      payload.meeting['amount'] = this.billingInfo.amount;
    }
    return payload;
  }

  getPayloadForGuest(){
    return {
      meeting: {
        client: ParticipantType.GUEST,
        billing_type: BillingType.NONE
      }
    }
  }

  getAccess(payload) {
    this.addingParticipant = true;

    this.meeting.getMeetingAccess(payload).subscribe(
      (response) => {
        if (response.code == 200 || response.code == 201) {
          this.handelAccessResponse(response, payload.meeting.client);
          this.addingParticipant = false;
          this.$displayParticipantDetail.emit(true);
          this.selectedUserType = ParticipantType.NONE;
          this.openSnackBar(this.translateService.instant('MEETING.addParticipant.copyDetail'), {success: true});
        }
        else{
          this.openSnackBar(this.translateService.instant('COMMON.error'), {error: true});
        }
        this.addingParticipant = false;
        this.cdr.detectChanges();
      },
      err => {
        console.error(err);
        this.addingParticipant = false;
        this.cdr.detectChanges();
        this.openSnackBar(this.translateService.instant('COMMON.error'), {error: true});
      }
    )

  }

  handelAccessResponse(response: meetingAccessPOSTResponse, participantType: any) {
    this.meeting.participantDetail = {};
    this.meeting.participantDetail['toDisplay'] = 'access';
    response.data.meeting['participant_type'] = participantType;
    this.meeting.participantDetail['access'] = response.data.meeting;
    this.cdr.detectChanges();
    this.$displayParticipantDetail.emit(true);
  }

  

  clearBilling() {
    if (this.billingComp) {
      this.billingComp.initBilling();
    }
  }

  openSnackBar(text, meta) {
		this._snackBar.openFromComponent(ActionNotificationComponent, {
			data:{
				message: text, ...meta
			},
			duration: 20000,
			horizontalPosition: 'right',
			panelClass: 'customSnackBarBackground'
		})
	}

}
