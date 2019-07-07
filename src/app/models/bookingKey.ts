export class BookingKey {
    public bookingKeyId: any;
    public name: string;
    public isDeactivated: boolean;
    constructor(
    ) {

        if (this.bookingKeyId == null) {
            this.bookingKeyId = this.createId();
        }
    }

    private createId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}