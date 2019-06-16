export class UserDetail {
    constructor(
        public guid?: string,
        public name?: string,
        public value?: string
    ) {
        this.guid = this.createGuid();
    }
    private createGuid(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}