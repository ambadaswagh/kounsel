import { Component, OnInit, Input, ViewChild, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import videojs from 'video.js';
import { Attachment } from '../../../../../../core/model/profile/profile.model';
declare var $: any;

@Component({
  selector: 'kt-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {
  @Input() attachment: Attachment;
  @ViewChild('target', { static: true }) target: ElementRef;
  @Output() stopOthers = new EventEmitter<any>();

  option = {
    autoplay: false,
    controls: true,
    sources: [],
    width: 375,
    height: 235,
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (window.innerWidth < 1025) {
      if (this.player && this.option.height > 189) {
        this.player.height(189);
        this.player.width(300);
        this.option.height = 189;
        this.option.width = 300;
      }

    }
    else {
      if (this.player && this.option.height < 235) {
        this.player.height(235);
        this.player.width(375);
        this.option.height = 235;
        this.option.width = 375;
      }
    }
  }

  player: videojs.Player;

  constructor(private elementRef: ElementRef) { }

  ngOnInit() {
    if (window.innerWidth < 1025) {
      this.option.height = 189;
      this.option.width = 300;
    }
    this.option.sources = this.attachment['sources'];
    this.player = videojs(this.target.nativeElement, this.option, () => {
      $('.vjs-big-play-button').on('contextmenu', function(e) {
        return false;
      });

      

      $('.vjs-modal-dialog-content').on('contextmenu', function(e) {
        return false;
      });

      this.player.on("play", () => {
        this.videoStartedPlaying();
      });
    });
  }

  videoStartedPlaying() {
    this.stopOthers.emit({
      player: this.player,
      attachment_id: this.attachment.attachment_id
    });
  }

  ngOnDestroy() {
    if (this.player) {
      $('.vjs-big-play-button').off('contextmenu');
      $('.vjs-modal-dialog-content').off('contextmenu');
      this.player.dispose();

    }
  }
}
