import { Helper } from 'src/static/Helper';

export class UserDetail {
    constructor(
        public detailid?: any,
        public name?: string
    ) {

        if (this.detailid == null) {
            this.detailid = Helper.createId();
        }
    }
}