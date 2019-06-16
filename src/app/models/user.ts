import { UserDetail } from './userDetail';
export class User {

    public guid = '';
    public firstname = '';
    public lastname = '';
    public signature?: string;
    public userDetails: UserDetail[] = new Array();

    constructor(data?) {
        if (data) {
            for (const property in data) {
                if (data.hasOwnProperty(property)) {
                    (this as any)[property] = (data as any)[property];
                }
            }
        }
        
        if (this.guid === '') {
            this.createGuid();
        }
    }

    private createGuid(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}