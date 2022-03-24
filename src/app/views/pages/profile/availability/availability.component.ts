import { Component, OnInit, ChangeDetectorRef, HostListener, Output, EventEmitter } from '@angular/core';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material';
import { ActionNotificationComponent } from '../../../partials/content/crud';

@Component({
  selector: 'kt-availability',
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.scss']
})
export class AvailabilityComponent implements OnInit {
  @Output() complete = new EventEmitter<any>();
  @Output() inComplete = new EventEmitter<any>();
  available_now = false;
  timeZones = moment_tz.tz.names();
  availability = {};
  availability_loaded = true;
  innerWidth = 0;
  addEnabled = false;
  daysOfWeek = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  daysOfMonth = new Set();
  initialDaysOfMonth = new Set();

  daysUserHave = new Set();
  daysAvailableToUser = [];

  newDayTemplate = {
    dayType: '',
    dayOfWeek: '',
    dayOfMonth: '', // for special
    _dayOfMonth: '',
    label: '', // for special
    slots: [],
    _newSlots: [],
    newSlot: {
      start: '09:00 am',
      _start: { hour: 9, minute: 0 },
      end: '09:00 am',
      _end: { hour: 9, minute: 0 }
    },
    existing: false
  }

  newDay: any = {
    dayType: '',
    dayOfWeek: '',
    dayOfMonth: '', // for special
    _dayOfMonth: '',
    label: '', // for special
    slots: [],
    _newSlots: [],
    newSlot: {
      start: '09:00 am',
      _start: { hour: 9, minute: 0 },
      end: '09:00 am',
      _end: { hour: 9, minute: 0 }
    },
    existing: false
  }

  slotValidationErrors = {
    endSmallThenStart: '',
    slotConflict: ''
  }

  loadingOperation = false;

  weekDayOrder = {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 7
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  spaceValidationRegex = new RegExp(/^\s*$/);
  specialDayLabelError = '';

  constructor(private profileService: ProfileService, private cdr: ChangeDetectorRef, private _snackBar: MatSnackBar) { }

  ngOnInit() {

    this.innerWidth = window.innerWidth;

    this.profileService.getAvailability().subscribe(
      response => {
        this.availability = response['data'];
        this.formatTimeForDispaly();
        this.cdr.detectChanges();
      },
      err => {
        console.log(err);
      }
    )
  }



  formatTimeForDispaly() {
    this.availability_loaded = false;
    this.available_now = this.availability['available'] == 10 ? true : false;
    this.daysUserHave.clear();
    this.daysOfMonth.clear()
    this.initialDaysOfMonth.clear();


    if (this.availability['day']) {
      this.availability['day'].forEach(day => {

        if (this.daysOfWeek.has(day.day)) {
          this.daysUserHave.add(day.day);
        }
        else {
          this.daysOfMonth.add(day.day);
          this.initialDaysOfMonth.add(day.day);
        }

        if (day['open']) {
          day['open'].forEach(slot => {
            slot['_start'] = moment.utc().startOf('day').add(slot['start'], 'minutes').format('hh:mm a');
            slot['_end'] = moment.utc().startOf('day').add(slot['end'], 'minutes').format('hh:mm a');
          })
        }

      })
    }
    else {
      this.availability['day'] = [];
    }

    this.daysAvailableToUser = _.remove(Array.from(this.daysOfWeek), item => !this.daysUserHave.has(item));

    this.availability['day'].sort((a, b) => {
      if (!a.label && !b.label) {
        return this.weekDayOrder[a.day.toLowerCase()] - this.weekDayOrder[b.day.toLowerCase()]
      }
      else if (!a.label && b.label) {
        return -1;
      }
      else if (a.label && !b.label) {
        return 1;
      }
      else {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      }
    })
    console.log(this.availability['day'])
    this.cdr.detectChanges();
  }

  editAvailability(_idx) {
    if (_idx > -1) {
      this.editExisting(_idx);
    }
    else {
      this.addNew();
    }
  }

  editExisting(_idx) {
    this.newDay = JSON.parse(JSON.stringify(this.newDayTemplate));
    // weekday
    if (this.availability['day'][_idx]['label'] == '') {
      this.newDay.dayType = 'Weekday';
      this.newDay.dayOfWeek = this.availability['day'][_idx]['day'];
      this.newDay.slots = [...this.availability['day'][_idx]['open']];
      this.newDay.existing = true;
    }
    else {
      this.newDay.dayType = 'Special Day';
      this.newDay.dayOfMonth = this.availability['day'][_idx]['day'];
      this.newDay._dayOfMonth = new Date(this.availability['day'][_idx]['day']);
      this.newDay.slots = [...this.availability['day'][_idx]['open']];
      this.newDay.label = this.availability['day'][_idx]['label'];
      this.newDay.existing = true;
    }
  }

  /**
   * add new day
   */
  addNew() {
    this.newDay = JSON.parse(JSON.stringify(this.newDayTemplate));
    this.addEnabled = true;
  }

  ifAllSlotsValid() {
    for (let slot of this.newDay._newSlots) {
      if (slot.conflictWithOtherSlots != '' || slot.startGreaterThanEndError != '') {
        return false;
      }
    }
    return true;
  }


  slotValidation(idx, startTime, endTime) {
    if (startTime >= endTime) {
      this.newDay._newSlots[idx].startGreaterThanEndError = 'Start time should be smaller than end time.'
      return false;
    }
    this.newDay._newSlots[idx].startGreaterThanEndError = ''

    this.newDay._newSlots[idx].conflictWithOtherSlots = '';
    // debugger;
    this.newDay._newSlots.forEach((slot, _idx) => {
      if (idx != _idx) {
        let slotStart = slot.start.dbTime;
        let slotEnd = slot.end.dbTime;
        if (slotStart <= startTime && slotEnd >= startTime) {
          this.newDay._newSlots[idx].conflictWithOtherSlots = 'There is conflict between timing of your slots';
          return false;
        }

        if (slotStart <= endTime && slotEnd >= endTime) {
          this.newDay._newSlots[idx].conflictWithOtherSlots = 'There is conflict between timing of your slots';
          return false;
        }
      }
    })

    this.newDay.slots.forEach(slot => {
      let slotStart = slot.start;
      let slotEnd = slot.end;
      if (slotStart <= startTime && slotEnd >= startTime) {
        this.newDay._newSlots[idx].conflictWithOtherSlots = 'There is conflict between timing of your slots';
        return false;
      }

      if (slotStart <= endTime && slotEnd >= endTime) {
        this.newDay._newSlots[idx].conflictWithOtherSlots = 'There is conflict between timing of your slots';
        return false;
      }
    })

    return true;
  }



  /**
   * add a new slot to the day
   */
  addSlot() {

    this.newDay._newSlots.push({
      start: {
        displayTime: '09:00 am',
        minuteTime: { hour: 9, minute: 0 },
        focused: false,
        dbTime: 540
      },

      end: {
        displayTime: '10:00 am',
        minuteTime: { hour: 10, minute: 0 },
        focused: false,
        dbTime: 600
      },

      startGreaterThanEndError: '',
      conflictWithOtherSlots: ''
    })

    this.slotValidation(this.newDay._newSlots.length - 1, 540, 600);
  }


  updateSlotEndTime(idx) {
    let start = (this.newDay._newSlots[idx].start.minuteTime.hour * 60) + this.newDay._newSlots[idx].start.minuteTime.minute;
    let end = (this.newDay._newSlots[idx].end.minuteTime.hour * 60) + this.newDay._newSlots[idx].end.minuteTime.minute;
    this.slotValidation(idx, start, end);

    this.newDay._newSlots[idx].start.dbTime = start;
    this.newDay._newSlots[idx].end.dbTime = end;
    this.newDay._newSlots[idx].end.displayTime = this.newDay._newSlots[idx].end.minuteTime.hour + ":" + this.newDay._newSlots[idx].end.minuteTime.minute;
    this.newDay._newSlots[idx].end.displayTime = moment(this.newDay._newSlots[idx].end.displayTime, 'hh:mm').format('hh:mm a');
  }


  updateSlotStartTime(idx) {
    let start = (this.newDay._newSlots[idx].start.minuteTime.hour * 60) + this.newDay._newSlots[idx].start.minuteTime.minute;
    let end = (this.newDay._newSlots[idx].end.minuteTime.hour * 60) + this.newDay._newSlots[idx].end.minuteTime.minute;
    this.slotValidation(idx, start, end);

    this.newDay._newSlots[idx].start.dbTime = start;
    this.newDay._newSlots[idx].end.dbTime = end;
    this.newDay._newSlots[idx].start.displayTime = this.newDay._newSlots[idx].start.minuteTime.hour + ":" + this.newDay._newSlots[idx].start.minuteTime.minute;
    this.newDay._newSlots[idx].start.displayTime = moment(this.newDay._newSlots[idx].start.displayTime, 'hh:mm').format('hh:mm a');
  }


  saveWeekDay() {
    let availabilityObj = {};

    if (this.newDay.label === '') {
      availabilityObj = this.formatDay();
    }
    else {
      availabilityObj = this.formatSpecialDay();
    }

    this.loadingOperation = true;
    if (this.availability['crud'] == 2) {
      this.availability['crud'] = 5;
    }

    if (this.availability['crud'] != 0) {
      this.profileService.putAvalibility(availabilityObj).subscribe(
        response => {
          this.postSucess(response);
        },
        err => {
          this.loadingOperation = false;
          this.openSnackBar("Something went wrong, please try again", {error: true});
          console.log(err);
          this.cdr.detectChanges();
        }
      )
    }
    else {
      this.availability['crud'] == 2;
      this.profileService.postAvalibility(availabilityObj).subscribe(
        response => {
          console.log(response);
          this.postSucess(response);
        },
        err => {
          this.loadingOperation = false;
          this.openSnackBar("Something went wrong, please try again", {error: true});
          console.log(err);
          this.cdr.detectChanges();
        }
      )
    }

  }


  postSucess(response) {
    this.openSnackBar("Time slot added successfully", {success: true});
    this.loadingOperation = false;
    this.cdr.detectChanges();
    this.availability = response['data'];
    this.formatTimeForDispaly();
    let current_editing_day_index = -1;

    if (this.newDay.label === '') {
      current_editing_day_index = this.availability['day'].findIndex((item) => item.day == this.newDay.dayOfWeek);
    }
    else {
      current_editing_day_index = this.availability['day'].findIndex((item) => item.day == this.newDay.dayOfMonth);
    }
    this.editAvailability(current_editing_day_index);
    this.addEnabled = false;
    this.toggleCompleteIncomplete();
    this.cdr.detectChanges();
  }



  formatDay() {
    const availabilityObj = JSON.parse(JSON.stringify(this.availability));
    availabilityObj.day = availabilityObj.day.filter(item => item.day === this.newDay.dayOfWeek);

    if (availabilityObj.day.length) availabilityObj.day[0]['crud'] = 5;

    availabilityObj.day = availabilityObj.day.length ? availabilityObj.day : [{ crud: 2, type: 5, day: this.newDay.dayOfWeek, label: "" }];

    availabilityObj.day[0]['open'] = this.newDay._newSlots.map(item => ({
      start: item.start.dbTime,
      end: item.end.dbTime,
      crud: 2
    }))

    return availabilityObj;
  }



  formatSpecialDay() {
    const availabilityObj = JSON.parse(JSON.stringify(this.availability));
    availabilityObj.day = availabilityObj.day.filter(item => item.day === this.newDay.dayOfMonth);

    if (availabilityObj.day.length) availabilityObj.day[0]['crud'] = 5;

    availabilityObj.day = availabilityObj.day.length ? availabilityObj.day : [{ crud: 2, type: 3, day: this.newDay.dayOfMonth, label: this.newDay.label }];

    availabilityObj.day[0]['open'] = this.newDay._newSlots.map(item => ({
      start: item.start.dbTime,
      end: item.end.dbTime,
      crud: 2
    }))

    return availabilityObj;
  }



  delete(day, slot_idx) {
    if (this.newDay.label !== '') {
      this.deleteSpecialDaySlot(day, slot_idx);
    }
    else {
      this.deleteExistingSlot(day, slot_idx);
    }
  }


  deleteExistingSlot(day, slot_idx) {
    let day_idx = this.availability['day'].findIndex(item => item.day === day);

    // index not found
    if (day_idx < 0) {
      console.error('day not found');
      return;
    }

    const to_delete = JSON.parse(JSON.stringify(this.availability['day'][day_idx]));
    const availabilityObj = JSON.parse(JSON.stringify(this.availability));
    availabilityObj['day'] = [to_delete];
    availabilityObj['day'][0]['crud'] = 5;
    availabilityObj['day'][0].open = availabilityObj['day'][0].open.filter((item, i) => {
      item['crud'] = 3;
      return i == slot_idx;
    });


    // if day doesnt have any slot delete the day itslef
    if (this.availability['day'][day_idx].open.length == 1) {
      // add delete crud 
      availabilityObj['day'][0]['crud'] = 3;
    }

    this.loadingOperation = true;

    this.profileService.putAvalibility(availabilityObj).subscribe(
      response => {
        this.openSnackBar("Time slot deleted successfully", {success: true});
        this.loadingOperation = false;
        this.availability = response['data'];
        this.formatTimeForDispaly();
        const current_editing_day_index = this.availability['day'].findIndex((item) => item.day == this.newDay.dayOfWeek);
        this.editAvailability(current_editing_day_index);
        this.toggleCompleteIncomplete();
        this.cdr.detectChanges();
      },
      err => {
        this.openSnackBar("Something went wrong, please try again", {error: true});
        this.loadingOperation = false;
        console.log(err);
      }
    )

  }



  deleteSpecialDaySlot(day, slot_idx) {
    let day_idx = this.availability['day'].findIndex(item => item.day === this.newDay.dayOfMonth);

    // index not found
    if (day_idx < 0) {
      console.error('day not found');
      return;
    }

    const to_delete = JSON.parse(JSON.stringify(this.availability['day'][day_idx]));
    const availabilityObj = JSON.parse(JSON.stringify(this.availability));
    availabilityObj['day'] = [to_delete];
    availabilityObj['day'][0]['crud'] = 5;
    availabilityObj['day'][0].open = availabilityObj['day'][0].open.filter((item, i) => {
      item['crud'] = 3;
      return i == slot_idx;
    });


    // if day doesnt have any slot delete the day itslef
    if (this.availability['day'][day_idx].open.length == 1) {
      // add delete crud 
      availabilityObj['day'][0]['crud'] = 3;
    }


    console.log(availabilityObj);
    this.loadingOperation = true;
    this.profileService.putAvalibility(availabilityObj).subscribe(
      response => {
        this.openSnackBar("Time slot deleted successfully", {success: true});
        this.loadingOperation = false;
        this.availability = response['data'];
        this.formatTimeForDispaly();
        const current_editing_day_index = this.availability['day'].findIndex((item) => item.day == this.newDay.dayOfMonth);
        this.editAvailability(current_editing_day_index);
        this.toggleCompleteIncomplete();
        this.cdr.detectChanges();
      },
      err => {
        this.openSnackBar("Something went wrong, please try again", {error: true});
        this.loadingOperation = false;
        console.log(err);
      }
    )

  }


  updateDayOfMonth(_date) {
    console.log(_date)
    this.newDay.dayOfMonth = moment(_date).format("MMM, DD");
    this.newDay._dayOfMonth = _date;
  }


  isSpecialDayValid() {
    if (!this.newDay.existing) {
      return !this.daysOfMonth.has(this.newDay.dayOfMonth) && this.specialDayLabelValid()
    }
    return true;
  }



  isWeekDayValid() {
    if (!this.newDay.existing) {
      return this.newDay.dayOfWeek != '';
    }
    return true;
  }



  toggleAvailability() {
    this.available_now = !this.available_now;
    if (this.available_now) {
      this.availability['available'] = 10;
    }
    else {
      this.availability['available'] = 20;
    }

    const availabilityObj = JSON.parse(JSON.stringify(this.availability));
    delete availabilityObj['day'];
    if (this.availability['crud'] != 0) {
      availabilityObj['crud'] = 5;
      this.profileService.putAvalibility(availabilityObj).subscribe(
        response => {
        },
        err => {
          console.log(err);
          this.openSnackBar("Something went wrong, please try again", {error: true});

          this.available_now = !this.available_now;
          if (this.available_now) {
            this.availability['available'] = 10;
          }
          else {
            this.availability['available'] = 20;
          }
        }
      )
    }
    else {
      availabilityObj['crud'] = 2;
      this.profileService.postAvalibility(availabilityObj).subscribe(
        response => {
          this.availability = response['data'];
          this.formatTimeForDispaly();
          this.cdr.detectChanges();
        },
        err => {
          console.log(err);
          this.openSnackBar("Something went wrong, please try again", {error: true});

          this.available_now = !this.available_now;
          if (this.available_now) {
            this.availability['available'] = 10;
          }
          else {
            this.availability['available'] = 20;
          }
        }
      )
    }

  }



  openSnackBar(text, meta) {
		this._snackBar.openFromComponent(ActionNotificationComponent, {
			data:{
				message: text, ...meta
			},
			duration: 5000,
			horizontalPosition: 'right',
			panelClass: 'customSnackBarBackground'
		})
	}



  timeZonesChanged() {
    const availabilityObj = JSON.parse(JSON.stringify(this.availability));
    delete availabilityObj['day'];
    availabilityObj['crud'] = 5;
    if (this.availability['crud'] != 0) {
      this.profileService.putAvalibility(availabilityObj).subscribe(
        response => {
          console.log(response);
          this.openSnackBar("Timezone successfully updated", {success: true});
        },
        err => {
          console.log(err);
          this.openSnackBar("Something went wrong, please try again", {error: true});
        }
      )
    }
    else {
      availabilityObj['crud'] = 2;
      this.profileService.postAvalibility(availabilityObj).subscribe(
        response => {
          this.availability = response['data'];
          this.formatTimeForDispaly();
          this.cdr.detectChanges();
          this.openSnackBar("Timezone successfully updated", {success: true});
        },
        err => {
          console.log(err);
          this.openSnackBar("Something went wrong, please try again", {error: true});
        }
      )
    }

  }

  _close() {
    this.addEnabled = false;
    this.newDay = JSON.parse(JSON.stringify(this.newDayTemplate));
  }

  p_default(event) {
    event.stopPropagation();
  }

  toggleCompleteIncomplete() {
    if (this.availability['day'].length) this.complete.emit();
    else this.inComplete.emit();
  }

  deleteNewSlot(idx: number) {
    this.newDay._newSlots.splice(idx, 1);
    for (let i = 0; i < this.newDay._newSlots.length; i++) {
      this.updateSlotStartTime(i);
      this.updateSlotEndTime(i);
    }
    this.cdr.detectChanges();
  }


  limitNewDayLabel(value: string) {
    if (value.length > 32) {
      this.newDay.label = value;
      this.cdr.detectChanges();
      this.newDay.label = value.substr(0, 32);
      this.cdr.markForCheck();
    }
  }

  specialDayLabelValid() {
    return !this.spaceValidationRegex.test(this.newDay.label);
  }
}

