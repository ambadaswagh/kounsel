import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { has } from 'lodash';
import { ConferenceMetaData } from '../model/meeting/conference.model';
import { ParticipantType } from '../model/meeting/Participant.model';
import { RestBoolean } from '../model/restBoolean.model';
import { ConferenceService } from '../services/general/meeting/conference.service';
import { MeetingService } from '../services/general/meeting/meeting.service';
import { FireBaseUserService } from '../services/user/fire-base-user.service';

@Injectable({
    providedIn: 'root'
})
export class ConferenceAuthGuard implements CanActivate {

    constructor(private router: Router, private user: FireBaseUserService, private conference: ConferenceService, private meeting: MeetingService) { }

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        try {
            const queryParameters = next.queryParams;
            const user = await this.user.isLoggedIn();

            /**
             * if user if logged in or trying to join via query param
             */
            if (user || this.isQpValid(queryParameters)) {

                /**
                 * if user came via redirection
                 */
                if (this.isQpValid(queryParameters)) {
                    
                    /**
                     * fetch join response out of query param
                     */
                    let meetingMeta: ConferenceMetaData = JSON.parse(atob(queryParameters['meta']));


                    /**
                     * if its client and join call is required
                     */
                    if( has(meetingMeta, 'login_required') && meetingMeta.login_required == RestBoolean.TRUE ){
                        if( user ){
                            const joinPayload = { meeting: meetingMeta.meeting };
                            const joinResponse = await this.meeting.join(joinPayload).toPromise();

                            if( joinResponse.code != 200 ){
                                throw new Error('Error in join call');
                            }

                            meetingMeta = joinResponse.data;
                        }
                        /**
                         * if user is not logged in
                         */
                        else {
                            /**
                             * again construct the query and redirect user to login
                             */
                            const qp = new URLSearchParams();
                            for(let key in queryParameters){
                                qp.set(key, queryParameters[key]);
                            }
                            this.router.navigate(['auth', 'login'], { queryParams: { returnUrl: '/meeting/conference?' + qp.toString() } });
                            return false;
                        }
                    }

                    /**
                     * parse aws_meeting_detail
                     */
                    if( meetingMeta.meeting.aws_meeting_details ){
                        meetingMeta.meeting.aws_meeting_details = JSON.parse(meetingMeta.meeting.aws_meeting_details as string);
                    }
                    else{
                        throw new Error('AWS meeting details missing');
                    }

                    /**
                     * parse aws_attendee_detail
                     */
                    if( meetingMeta.meeting.participant.access.aws_attendee_details ){
                        meetingMeta.meeting.participant.access.aws_attendee_details = JSON.parse(meetingMeta.meeting.participant.access.aws_attendee_details as string);
                    }
                    else{
                        throw new Error('AWS participant details missing');
                    }


                    this.conference.metaData = meetingMeta;
                    this.conference.audio = JSON.parse(queryParameters['audio']);
                    this.conference.video = JSON.parse(queryParameters['video']);

                    if (meetingMeta.join != RestBoolean.TRUE) {
                        this.router.navigate(['auth', 'login']);
                        return false;
                    }

                    if (meetingMeta.meeting.participant.access.client == ParticipantType.GUEST) {
                        this.conference.guest = true;
                    }

                    if (meetingMeta.meeting.participant.access.client == ParticipantType.CLIENT) {
                        if (user) {
                            this.conference.userId = await this.user.getUserId();
                            return true;
                        }
                        this.router.navigate(['auth', 'login'], { queryParams: { returnUrl: '/meeting/conference' } })
                        return false;
                    }
                    
                    return true;
                }
                else{
                    if( !this.conference.metaData ){
                        this.router.navigate(['meeting']);
                        return false;
                    }

                    if (this.conference.metaData.meeting.participant.access.client == ParticipantType.GUEST) {
                        this.conference.guest = true;
                    }

                    this.conference.userId = await this.user.getUserId();
                }

                return true;
            }
            this.router.navigate(['auth', 'login'], { queryParams: { returnUrl: state.url } });
            return false;
        } catch (error) {
            console.error(error);
            this.router.navigate(['auth', 'login'], { queryParams: { returnUrl: state.url } });
            return false;
        }
    }

    // parseQuery(queryParam: any) {
    //     try {
    //         const meetingMeta = atob(queryParam['meta']);
    //         const parsed: ConferenceMetaData = JSON.parse(meetingMeta);
    //         parsed.meeting.aws_meeting_details = JSON.parse(parsed.meeting.aws_meeting_details as string);
    //         parsed.meeting.participant.access.aws_attendee_details = JSON.parse(parsed.meeting.participant.access.aws_attendee_details as string);
    //         return parsed;
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // }

    isQpValid(queryParameters) {
        // && has(queryParameters, 'audio') && has(queryParameters, 'video')
        return Object.keys(queryParameters).length && has(queryParameters, 'meta');
    }

}
