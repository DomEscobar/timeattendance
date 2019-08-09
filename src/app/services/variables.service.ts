import { Injectable } from '@angular/core';

@Injectable()
export class VariablesService {

  public isApp: boolean;
  public isOnline: boolean;
  public apiUrl: string;

  constructor() { }
}
