import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Router , ActivatedRoute} from '@angular/router'

@Component({
  selector: 'kt-create-appointment',
  templateUrl: './create-appointment.component.html',
  styleUrls: ['./create-appointment.component.scss']
})
export class CreateAppointmentComponent implements OnInit {
  innerWidth = 1025;
  showSidebar = true;

  createAppointmentForm: FormGroup = new FormGroup({
    conselor: new FormControl('', [Validators.required]),
    start: new FormControl('', [Validators.required]),
    end: new FormControl('', [Validators.required])
  })

  constructor(
    private cdr: ChangeDetectorRef,
    public translateService: TranslateService,
    private router: Router,
    private activatedRoute : ActivatedRoute
  ) { }

  ngOnInit() {
    this.showSidebar = true;
  }
  
  cancel() {
    this.showSidebar = false;
  }

  clearForm() {
    this.createAppointmentForm.patchValue({
      conselor: '',
      fromDate: '',
      toDate: ''
    })
  }

  
  async submit() {

    const queryParams = { 
      counselor_uname : this.createAppointmentForm.get('conselor').value, 
      start : this.createAppointmentForm.get('start').value,
      end :  this.createAppointmentForm.get('end').value
    };
    
    const url = `/appointment/book`;
    this.router.navigate([url], {queryParams: queryParams});
   
  }

}
