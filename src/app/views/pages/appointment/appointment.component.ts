import {
	AfterContentInit,
	ChangeDetectorRef,
	Component,
	NgZone,
	OnInit,
} from '@angular/core';
import { Router } from '@angular/router'
import * as moment from 'moment';
const todayDate = moment().startOf('day');
const YM = todayDate.format('YYYY-MM');
const TODAY = todayDate.format('YYYY-MM-DD');
import Calendar from 'tui-calendar';
import PerfectScrollbar from 'perfect-scrollbar';
import { AppointmentService } from '../../../core/services/general/appointment/appointment.service';
import { Appointment, AppointmentGETResponse } from '../../../core/model/appointment/appointment.model';

declare var $: any;
@Component({
	selector: 'kt-appointment',
	templateUrl: './appointment.component.html',
	styleUrls: ['./appointment.component.scss']
})
export class AppointmentComponent implements OnInit, AfterContentInit {
	startDate = moment().subtract(62, 'h').toISOString();
	endDate = moment().subtract(61, 'h').toISOString();
	appointments: Appointment[];
	appointmentDetail;
	bookAppointment: boolean = false;
	//scheduleAppointment : boolean = false;
	monthList =
		[	{ type: 'monthselection', value: 'Jan',
				name: 'January'
			},
			{ type: 'monthselection', value: 'Feb',
				name: 'February'
			},
			{ type: 'monthselection', value: 'Mar',
				name: 'March'
			},
			{ type: 'monthselection', value: 'Apr',
				name: 'April'
			},
			{ type: 'monthselection', value: 'May',
				name: 'May'
			},
			{ type: 'monthselection', value: 'Jun',
				name: 'June'
			},
			{ type: 'monthselection', value: 'Jul',
				name: 'July'
			},
			{ type: 'monthselection', value: 'Aug',
				name: 'August'
			},
			{ type: 'monthselection', value: 'Sep',
				name: 'September'
			},
			{ type: 'monthselection', value: 'Oct',
				name: 'October'
			},
			{ type: 'monthselection', value: 'Nov',
				name: 'November'
			},
			{ type: 'monthselection', value: 'Dec',
				name: 'December'
			}
		];
	selectedMonth = moment().format('MMM');
	calenderRef: Calendar;
	selectedDuration = 'week';
	// Do not change list value is used calendarDurationSelection
	durationList = [{
		name: 'Day',
		value: 'day'
	},
	{
		name: 'Week',
		value: 'week'
	},
	{
		name: 'Month',
		value: 'month'
	},
	{
		name: '2 Week',
		value: '2week'
	},
	{
		name: '3 Week',
		value: '3week'
	}];
	apiCallConfig =  {
		start: moment().startOf('week').valueOf(),
		end: moment().endOf('week').valueOf(),
		tz: Intl.DateTimeFormat().resolvedOptions().timeZone + new Date().getTimezoneOffset(),
		by: 'time'
	};
	constructor(public appointmentService: AppointmentService, public ngZone: NgZone, public changeDetectorRef: ChangeDetectorRef, public router: Router) { }

	ngOnInit(): void {
		this.showCalendar();
		// this.getData();
		this.calendarDurationSelection({value: this.selectedDuration});
		// tslint:disable-next-line:no-string-literal
	
		window['angularComponentReference'] = {
			component: this, zone: this.ngZone,
			loadAngularFunction: (d, e) => this.angularFunctionCalled(d, e),
			scheduleEvent: (d, e) => this.scheduleEventFunctionCalled(e),
		};

		if(this.router.url.startsWith('/appointment/book')){
			this.bookAppointment = true;
		}

	}

	getData() {
		console.log(this.apiCallConfig);
		this.appointmentService.getAppointment(this.apiCallConfig).subscribe((res) => this.addAppointmentsInCalendar(res));
	}
	angularFunctionCalled(d, e) {
		console.log('angularFunctionCalledangularFunctionCalledangularFunctionCalled', d, e);
		this.appointmentDetail = this.appointments.find(item => item.appointment_id === e.schedule.id);
		this.appointmentDetail = { ...this.appointmentDetail };
		this.changeDetectorRef.detectChanges();
		$('.tui-full-calendar-popup').remove();
	}
	scheduleEventFunctionCalled(e) {
		console.log('angularscheduleEventFunctionCalledCalled', e);
		this.bookAppointment = true;
		this.changeDetectorRef.detectChanges();
	}
	ngAfterContentInit() {
	}
	today() {
		this.calenderRef.today();
		this.selectedMonth = moment(new Date(this.calenderRef.getDate().getTime())).format('MMM');
	}

	prev() {
		this.calenderRef.prev();
		this.selectedMonth = moment(new Date(this.calenderRef.getDate().getTime())).format('MMM');
	}

	next() {
		this.calenderRef.next();
		this.selectedMonth = moment(new Date(this.calenderRef.getDate().getTime())).format('MMM');
	}

	addAppointmentsInCalendar(res: AppointmentGETResponse) {

		console.log(res);
		const customStyle = 'border-radius: 5px;border: 0; color: #fff; background-color: #1565c0;';
		const appointments = [];
		this.appointments = res.data.appointments;
		if (res.data.appointments) {
			res.data.appointments.forEach(a => {
				appointments.push({
					id: a.appointment_id,
					calendarId: '1',
					title: `${a.service_provider.category}`,
					category: 'time',
					customStyle,
					dueDateClass: '',
					isVisible: true,
					start: moment(a.start).toISOString(),
					end: moment(a.end).toISOString(),
					body: `<div class="popup-wrapper">
				  <div class="popup-detail">
					<span>${moment(a.start).format('dddd, D MMMM')}</span></br>
					<span>${moment(a.start).format('HH:mm')} - ${moment(a.end).format('HH:mm')}</span>
				  </div>
				  <div class="popup-detail d-flex">
					<div>
					  <img src="${a.service_provider.image_url}" width="24" alt="">
					</div>
					<span>${a.service_provider.name}</span>
				  </div>
				  <div class="popup-detail">
					<h6>Note</h6>
					<span>${a.agenda}</span>
				  </div>
				  <div class="popup-detail">
					<h6>Estimated spending</h6>
					<span>$${a.service_provider.rate}</span>
				  </div>
				  <button class="btn" id="${a.appointment_id}">View Details</button>
				</div>`,
					isReadOnly: true
				});
			});
		}
		this.calenderRef.clear();
		this.calenderRef.createSchedules(appointments);
		this.calenderRef.on({
			clickSchedule(e) {
				console.log('clickSchedule', e);
				document.getElementById(e.schedule.id).addEventListener('click', (d) => {
					console.log(d, e);
					// tslint:disable-next-line:no-string-literal
					window['angularComponentReference'].zone.run(() => { window['angularComponentReference'].loadAngularFunction(d, e); });
				});
			},
			beforeCreateSchedule(e) {
				console.log('beforeCreateSchedule', e);
				window['angularComponentReference'].zone.run(() => { window['angularComponentReference'].scheduleEvent(e); });
			},
			beforeUpdateSchedule(e) {
				console.log('beforeUpdateSchedule', e);
			},
			beforeDeleteSchedule(e) {
				console.log('beforeDeleteSchedule', e);
			}
		});
	}

	showCalendar() {
		const WEEKLY_CUSTOM_THEME = {
			'week.dayname.height': '41px',
			'week.dayname.borderTop': '0',
			'week.dayname.borderBottom': '0',
			'week.dayname.borderLeft': '0',
			'week.dayname.paddingLeft': '5px',
			'week.dayname.backgroundColor': 'inherit',
			'week.dayname.textAlign': 'left',
			'week.today.color': '#b857d8',
			'week.pastDay.color': '#999',

			'week.vpanelSplitter.border': '0',
			'week.vpanelSplitter.height': '0',

			'week.daygrid.borderRight': '1px solid #e9edf3',
			'week.daygrid.backgroundColor': 'inherit',

			'week.daygridLeft.width': '77px',
			'week.daygridLeft.backgroundColor': 'transparent',
			'week.daygridLeft.paddingRight': '5px',
			'week.daygridLeft.borderRight': '1px solid #e9edf3',

			'week.today.backgroundColor': 'transparent',
			'week.weekend.backgroundColor': 'inherit',

			'week.timegridLeft.width': '77px',
			'week.timegridLeft.backgroundColor': '#fff',
			'week.timegridLeft.borderRight': '1px solid #e9edf3',
			'week.timegridLeft.fontSize': '12px',
			'week.timegridLeftTimezoneLabel.height': '51px',
			'week.timegridLeftAdditionalTimezone.backgroundColor': '#fdfdfd',

			'week.timegridOneHour.height': '60px',
			'week.timegridHalfHour.height': '24px',
			'week.timegridHalfHour.borderBottom': '1px dotted #f9f9f9',
			'week.timegridHorizontalLine.borderBottom': '1px solid #eee',

			'week.timegrid.paddingRight': '2px',
			'week.timegrid.paddingLeft': '2px',
			'week.timegrid.borderRight': '1px solid #e9edf3',
			'week.timegridSchedule.borderRadius': '0',
			'week.timegridSchedule.paddingLeft': '0',

			'week.currentTime.color': '#1565c0',
			'week.currentTime.fontSize': '12px',
			'week.currentTime.fontWeight': 'bold',

			'week.pastTime.color': '#7d96b3',
			'week.pastTime.fontWeight': 'normal',

			'week.futureTime.color': '#7d96b3',
			'week.futureTime.fontWeight': 'normal',

			'week.currentTimeLinePast.border': '1px solid rgba(19, 93, 230, 0.3)',
			'week.currentTimeLineBullet.backgroundColor': '#1565c0',
			'week.currentTimeLineToday.border': '1px solid #1565c0',
			'week.currentTimeLineFuture.border': '1px solid #1565c0',

			'week.creationGuide.color': '#1565c0',
			'week.creationGuide.fontSize': '12px',
			'week.creationGuide.fontWeight': 'bold',

			'week.dayGridSchedule.borderRadius': '0',
			'week.dayGridSchedule.margin': '0',
		};

		this.calenderRef = new Calendar('#calendar', {
			defaultView: 'month',
			theme: WEEKLY_CUSTOM_THEME,
			taskView: false,
			// scheduleView: false,
			useDetailPopup: true,
			disableClick: true,
			useCreationPopup: false,
			month: {
				// visibleWeeksCount: 0,
				scheduleFilter(schedule) {
					return Boolean(schedule.isVisible);
				}
			},
			template: {
				dayGridTitle: () => null,
				monthDayname(dayname) {
					return '<span class="calendar-week-dayname-name">' + dayname.label + '</span>';
				},
				weekDayname(weekname) {
					// tslint:disable-next-line:max-line-length
					return `<div class="calendar-week-name ${weekname.isToday ? 'active' : ''}"><span>${weekname.date}</span><span>${weekname.dayName}</span></div>`;
				},
				popupDetailDate() {
					return '';
				},
				popupEdit() {
					return 'Edit';
				},
				popupDelete() {
					return 'Delete';
				}
			}
		});

		['tui-full-calendar-timegrid-container',
		'calendar-1',
		'appointment-content', 'kt-container'].forEach(_ => {
			const container = document.getElementsByClassName(_)[0] as HTMLElement;
			if (container) {
				const ps = new PerfectScrollbar(container);
				ps.update();
			}
		});

	}
	calendarDurationSelection(e: { value: string; type?: string }) {
		console.log('calender duration selection', e);
		let val = e.value;
		const startDate: any = val;
		const endDate: any = val;
		const options = this.calenderRef.getOptions();
		options.month.visibleWeeksCount = 6;

		this.apiCallConfig.start = moment().startOf(startDate).valueOf();
		this.apiCallConfig.end = moment().endOf(endDate).valueOf();

		if (e.value === this.durationList[3].value) { // 2week view
			options.month.visibleWeeksCount = 2;
			val = this.durationList[2].value;
			this.apiCallConfig.start = moment().startOf('week').valueOf();
			this.apiCallConfig.end = moment().startOf('week').add(14, 'days').valueOf();
		}
		if (e.value === this.durationList[4].value) { // 3week view
			options.month.visibleWeeksCount = 3;
			val = this.durationList[2].value;
			this.apiCallConfig.start = moment().startOf('week').valueOf();
			this.apiCallConfig.end = moment().startOf('week').add(21, 'days').valueOf();
		}
		if (e.type === 'monthselection') {
			// date start of that month
			const m = `1 ${e.value} ${moment().format('YYYY')} `;
			this.apiCallConfig.start =  moment(m).valueOf();
			this.apiCallConfig.end = moment(m).endOf('month').valueOf();
			val = this.selectedDuration = this.durationList[2].value;
			this.calenderRef.setDate(new Date(moment(m).valueOf()));

		}
		this.calenderRef.setOptions(options, true);
		this.calenderRef.changeView(val, true);
		this.getData();
		console.log( moment('1 dec 2021').format());
		console.log( moment('1 dec 2021').startOf('month').valueOf());
	}
}
