import type { CloudFrontRequestEvent } from 'aws-lambda'
import { Authenticator } from 'cognito-at-edge'

declare module 'bun' {
  interface Env {
    USER_POOL_ID: string
    USER_POOL_CLIENT_ID: string
    USER_POOL_DOMAIN: string
  }
}

const authenticator = new Authenticator({
  // Replace these parameter values with those of your own environment
  region: 'ap-northeast-1', // user pool region
  userPoolId: process.env.USER_POOL_ID, // user pool ID
  userPoolAppId: process.env.USER_POOL_CLIENT_ID, // user pool app client ID
  userPoolDomain: process.env.USER_POOL_DOMAIN, // user pool domain
  cookieExpirationDays: 1,
  cookiePath: '/',
  httpOnly: true,
  sameSite: 'Lax',
})

exports.handler = async (event: CloudFrontRequestEvent) => authenticator.handle(event)
