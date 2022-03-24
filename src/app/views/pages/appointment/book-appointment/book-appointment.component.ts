import {
  AfterContentInit,
  HostListener,
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Router , ActivatedRoute} from '@angular/router'
import { AppointmentService } from '../../../../core/services/general/appointment/appointment.service';
import { AuthService, UserUpdated, User } from '../../../../core/auth/';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { FireBaseUserService } from '../../../../core/services/user/fire-base-user.service';
import { Appointment } from '../../../../core/model/appointment/appointment.model';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import { string0To255, string0To1000 } from 'aws-sdk/clients/customerprofiles';

@Component({
  selector: 'kt-book-appointment',
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss']
})
export class BookAppointmentComponent implements OnInit,OnChanges {

  @Input() appointmentDetail: Appointment;
  innerWidth = 1025;
  showSidebar = true;
  start : string;
  end : string;
  user : string
  name : string
  imageUrl : string
  profession : string0To1000
  rate : string
  totalSpendings : number
  serviceProviderId : string
  account_status : number;
  note : string;
  location : string;
  earnings : string;

  showUserDetails : boolean = false;
  conselor : string;
  
  @HostListener('window:resize', ['$event'])
  onResize(event) {
	this.innerWidth = window.innerWidth;
  } 

  bookAppointmentForm: FormGroup = new FormGroup({
    conselor: new FormControl('', [Validators.required]),
    start: new FormControl('', [Validators.required]),
    end: new FormControl('', [Validators.required]),
    note: new FormControl('', [Validators.required]),
    location : new FormControl('', [Validators.required]),
    earnings : new FormControl('', [Validators.required])
  })
  
  constructor(
    private cdr: ChangeDetectorRef,
    public translateService: TranslateService,
    private router: Router,
    private activatedRoute : ActivatedRoute,
    private appointmentService : AppointmentService,
    private profileService : ProfileService,
    private userService: FireBaseUserService

  ) { }


  ngOnInit() {
    
    this.user = this.userService.userId
    console.log('user : ' + this.user)
    this.activatedRoute.queryParams.subscribe(params => {
      this.conselor = params['counselor_uname'];
      this.start = params['start'];
      this.end = params['end'];
      this.start = moment(this.start).toISOString().split(".")[0];
      this.end = moment(this.end).toISOString().split(".")[0];
      this.getPublicProfile(this.conselor);
    });
    this.showSidebar = true;
  }

  ngAfterContentInit(): void {

  }
  ngAfterViewChecked(): void {
  
  }

  ngOnChanges(changes: SimpleChanges): void {
  console.log('====onChanges===================>>')
  }

  cancel() {
    this.showSidebar = false;
  }
  
  submit() { 
   if(!this.showUserDetails){
    let conselor =  this.bookAppointmentForm.get('conselor').value ;
    this.getPublicProfile(conselor);
   }else{
     this.createAppointment();
   }
  }

  async createAppointment(){
    try {
      this.cdr.detectChanges();
      this.conselor = this.bookAppointmentForm.get('conselor').value;

      const queryParams = {
        "appointment_id": "APP-" + uuid(),
        "start": this.bookAppointmentForm.get('start').value + moment().format('ZZ'),
        "end": this.bookAppointmentForm.get('end').value + moment().format('ZZ'),
        "agenda": this.bookAppointmentForm.get('note').value,
        "status":  this.account_status,
        "earnings": this.totalSpendings,
        "attachment": 0,
        "host_id": this.user,
        "service_provider_id": this.serviceProviderId,
        "host": "",
        "service_provider": ""
      }

      let serverResponse = await this.appointmentService.createAppointment(this.conselor, queryParams).toPromise();
      if (serverResponse.code == 200 || serverResponse.code == 201) {
        this.cdr.detectChanges();
        this.router.navigate(['/appointment'])
      } else {
        throw new Error('Some error happened please try again');
      }
      
    } catch (error) {
      console.log(error);
    }
    finally {
      this.cdr.detectChanges();
    }
  }

  getPublicProfile(id : String){

    this.profileService.getPublicProfile(id).subscribe(
      response => {
        if (response.code == 200) {
          this.name = response.data.profile.name;
          this.imageUrl = response.data.profile.image_url;
          this.profession = response.data.profile.profession;
          this.rate= response.data.profile.rate;
          this.account_status = response.data.account.account_status;
          this.serviceProviderId = response.data.profile.user_id;
          this.totalSpendings = this.calculateRate();
          this.earnings = (this.totalSpendings / 100).toFixed(2);
          this.showUserDetails = true;
          this.cdr.detectChanges();
        }
     });

    }

  formatDate(dateString) {
    return moment(dateString).format('DD MMM YYYY HH:mm a')
  }

  calculateRate(){
    var eventStartTime = new Date(this.start);
    var eventEndTime = new Date(this.end);
    var ms = eventEndTime.valueOf() - eventStartTime.valueOf();
    var minutes = ms/(1000*60)
    return (minutes * parseInt(this.rate))
  }
  
}
