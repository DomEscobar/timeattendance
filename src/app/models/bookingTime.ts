import moment from 'moment';

export class BookingTime {
    constructor(
        public bookingTimeId?,
        public date?: string,
        public clockIn?: string,
        public clockOut?: string,
        public bookingkeyId?: number,
        public actualTime?: string,
        public userid?: number,
        public isEdited?: boolean,
        public comment?: string,
    ) {
        if (this.bookingTimeId == null) {
            this.bookingTimeId = this.createGuid();
        }

        if (this.date == null) {
            this.date = moment(new Date()).format('DD.MM.YYYY');
        }
    }

    private createGuid(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}