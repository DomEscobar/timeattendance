export class UserDetailRelation {
    public detailid: number;
    public userid: number;
    public value = '';

    constructor(data?) {
        if (data) {
            for (const property in data) {
                if (data.hasOwnProperty(property)) {
                    (this as any)[property] = (data as any)[property];
                }
            }
        }
    }
}