import { UserDetailRelation } from './userDetailRelation';
export class User {

    public userid;
    public firstname = '';
    public lastname = '';
    public password?;
    public cst?;
    public userDetails: UserDetailRelation[] = new Array();

    constructor(data?) {
        if (data) {
            for (const property in data) {
                if (data.hasOwnProperty(property)) {
                    (this as any)[property] = (data as any)[property];
                }
            }
        }
        if (this.userid == null) {
            this.userid = this.createId();
        }
    }

    private createId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}