export class BookingLocation
{
    public bookingLocationId: any;
    public bookingTimeId: number;
    public latitude: number;
    public longitude: number;
    public isClockIn: boolean;
    constructor(data?)
    {
        if (data)
        {
            for (const property in data)
            {
                if (data.hasOwnProperty(property))
                {
                    (this as any)[property] = (data as any)[property];
                }
            }
        }
    }
}