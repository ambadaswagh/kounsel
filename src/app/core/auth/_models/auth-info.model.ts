export class AuthInfo {
  user: User;
  credential: Credential;
  additionalUserInfo: AdditionalUserInfo;
  operationType: string;
}

interface AdditionalUserInfo {
  providerId: string;
  isNewUser: boolean;
  profile: Profile;
}

interface Profile {
  name: string;
  granted_scopes: string;
  id: string;
  verified_email: boolean;
  given_name: string;
  locale: string;
  family_name: string;
  email: string;
  picture: string;
}

interface Credential {
  providerId: string;
  signInMethod: string;
  oauthIdToken: string;
  oauthAccessToken: string;
}

interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: any;
  isAnonymous: boolean;
  tenantId?: any;
  providerData: ProviderDatum[];
  apiKey: string;
  appName: string;
  authDomain: string;
  stsTokenManager: StsTokenManager;
  redirectEventId?: any;
  lastLoginAt: string;
  createdAt: string;
}

interface StsTokenManager {
  apiKey: string;
  refreshToken: string;
  accessToken: string;
  expirationTime: number;
}

interface ProviderDatum {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  phoneNumber?: any;
  providerId: string;
}