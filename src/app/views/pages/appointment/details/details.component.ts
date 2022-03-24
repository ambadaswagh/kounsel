import {
	AfterContentInit,
	HostListener,
	Component,
	OnInit,
	AfterViewChecked,
	Input,
	OnChanges,
	SimpleChanges,
	ChangeDetectorRef,
} from '@angular/core';
import PerfectScrollbar from 'perfect-scrollbar';
import { AppointmentService } from '../../../../core/services/general/appointment/appointment.service';
import { Appointment } from '../../../../core/model/appointment/appointment.model';
import { AppointmentAttachmentResp } from './../../../../core/model/appointment/appointment.attachment.model';
import { Attachment } from './../../../../core/model/profile/profile.model';

@Component({
	selector: 'kt-appointment-details',
	templateUrl: './details.component.html',
	styleUrls: ['./details.component.scss'],
})
export class AppointmentDetailsComponent implements OnInit, AfterContentInit, AfterViewChecked, OnChanges {

	@Input() appointmentDetail: Appointment;
	providerImage;
	innerWidth = 1025;
	showSidebar = false;
	appointmentObj;
	attachments: Attachment[] = [];
	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.innerWidth = window.innerWidth;
	}

	constructor(public appointmentService: AppointmentService, public changeDetectorRef: ChangeDetectorRef) {
	}

	ngOnInit(): void {
		setTimeout(() => {
			// ['section-appointment'].forEach((_) => {
			// 	const container = document.getElementsByClassName(_)[0] as HTMLElement;
			// 	const ps = new PerfectScrollbar(container);
			// 	ps.update();
			// });

		}, 0);

		// throw new Error('Method not implemented.');
	}
	ngOnChanges(changes: SimpleChanges): void {
		this.attachments = [];
		console.log(changes);
		this.providerImage = this.appointmentDetail.service_provider.image_url;
		if (this.appointmentDetail) {
		this.appointmentService.getAttachments( this.appointmentDetail.appointment_id)
		.subscribe((r: AppointmentAttachmentResp) => {
			console.log('asdfasdfasdf', r);
			if (r.code === 200 && r.data) {

				this.appointmentObj = r.data;
				this.attachments = r.data.attachments || [];
				this.changeDetectorRef.detectChanges();
			}
		});
		this.showSidebar = true;
		} else {
			this.showSidebar = false;
		}
	}
	ngAfterContentInit(): void {

		// throw new Error('Method not implemented.');
	}
	ngAfterViewChecked(): void {
	}
	cancel() {
		this.showSidebar = false;
	}
}
