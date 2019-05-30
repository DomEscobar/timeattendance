export class BookingTime {
    constructor(
        public guid: string = '',
        public date: Date = new Date(),
        public time?: string,
        public bsId?: number,
        public isClockIn: boolean = false,

    ) {
        this.guid = this.createGuid();
    }

    private createGuid(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}