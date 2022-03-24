import {
  AfterContentInit,
  HostListener,
  Component,
  OnInit,
  AfterViewChecked,
} from '@angular/core';
import PerfectScrollbar from 'perfect-scrollbar';

@Component({
  selector: 'kt-appointment-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class AppointmentDetailsComponent implements OnInit, AfterContentInit, AfterViewChecked {
  innerWidth = 1025;
  showSidebar = true;
  @HostListener('window:resize', ['$event'])
  onResize(event) {
	this.innerWidth = window.innerWidth;
  }
  ngOnInit(): void {
		setTimeout(() => {
		['section-appointment'].forEach((_) => {
			const container = document.getElementsByClassName(_)[0] as HTMLElement;
			const ps = new PerfectScrollbar(container);
			ps.update();
		});

		}, 0);

	// throw new Error('Method not implemented.');
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
