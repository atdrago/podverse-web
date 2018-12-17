
export const cookieConfig = {
  domain: process.env.COOKIE_DOMAIN ? process.env.COOKIE_DOMAIN : 'localhost',
  path: process.env.COOKIE_PATH ? process.env.COOKIE_PATH : '/'
}

export const paypalConfig = {
  production: process.env.PAYPAL_CLIENT_ID_PRODUCTION,
  sandbox: process.env.PAYPAL_CLIENT_ID_SANDBOX
}
