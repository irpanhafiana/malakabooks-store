import { environment } from '../../../environments/environment';

export class AuthConstants {
  static readonly API_URL: string = environment.apiUrl || (environment.apiBaseUrl + '/');
}
