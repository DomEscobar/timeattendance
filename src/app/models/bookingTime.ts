
import * as moment from 'moment';

export class BookingTime {
    constructor(
        public guid: string = '',
        public date?: string,
        public clockIn?: string,
        public clockOut?: string,
        public bsId?: number,
        public actualTime?: string,
    ) {
        this.guid = this.createGuid();
        this.date = moment(new Date()).format('DD.MM.YYYY');
    }

    private createGuid(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}