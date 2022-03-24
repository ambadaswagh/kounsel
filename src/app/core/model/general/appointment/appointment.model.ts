import { Profile } from "../../profile/profile.model";

export interface Appointment {
    "appointment_id": string,
    "status": number,
    "agenda": string,
    "start": string,
    "earnings": number,
    "end": string,
    "host_id": string,
    "attachment": number,
    "service_provider_id": string,
    "host": Account,
    "service_provider": Profile
}