export const environment = {
  production: false,
  appUrl: '',
  apiBaseUrl: '/api/v1',
  authUrl: '/bff/login',
  apiUrl: '/api/v1/',
  userPasswordApiUrl: '/api/UserPassword',
  posApiUrl: 'http://192.168.1.15:10100/',
  originCode: '32.71.10.10',
  // clientId / clientSecret / scope sengaja tidak ada di sini: seluruh negosiasi
  // OIDC dengan IS4 dilakukan BFF di sisi server.
  dokuScriptUrl: 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js',
  dokuStyleUrl: 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.css'
};

