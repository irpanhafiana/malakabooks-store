import { AuthConstants } from './auth-constant.service';

export class EndpointConstants {
  static readonly GET_CHECK_PAYMENT = `${AuthConstants.API_URL}ExternalMessage/Doku/Payment`;
}
