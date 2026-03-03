import BaseCommand, { type GlobalOptions } from '@/commands/base.ts'
import { deployStack, describeStack } from '@/lib/aws/cloudformation.ts'
import { saveVariables } from '@/lib/env/variables.ts'

type Options = GlobalOptions & {
  template: string
  stackName: string
  userPoolName: string
  userPoolDomainPrefix: string
  googleClientId: string
  googleClientSecret: string
  appHost: string
  capabilities?: string
}

export default class DeployCognitoCommand extends BaseCommand {
  constructor() {
    super('deploy:cognito')
    this.description('CloudFormation のスタックをデプロイします')
    this.requiredOption('--template <template>', 'テンプレートファイルのパスを指定します', 'cloudformation/cognito.yml')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します', `${process.env.STACK_FAMILY || 'example'}-cognito`)
    this.option('--user-pool-name <user-pool-name>', 'ユーザープール名を指定します', `${process.env.STACK_FAMILY || 'example'}-cognito`)
    this.option('--user-pool-domain-prefix <user-pool-domain-prefix>', 'ユーザープールドメインの prefix を指定します', process.env.USER_POOL_DOMAIN_PREFIX)
    this.option('--google-client-id <google-client-id>', 'Google OAuth クライアントのIDを指定します', process.env.GOOGLE_CLIENT_ID)
    this.option('--google-client-secret <google-client-secret>', 'Google OAuth クライアントのシークレットを指定します', process.env.GOOGLE_CLIENT_SECRET)
    this.option('--app-host <app-host>', 'アプリケーションのホスト名を指定します', process.env.APP_HOST)
    this.option('--capabilities <capabilities>', 'capabilities を指定します', 'CAPABILITY_IAM')

    this.action(this.handle)
  }

  private async handle({
    template,
    profile,
    region,
    stackName,
    userPoolName,
    userPoolDomainPrefix,
    googleClientId,
    googleClientSecret,
    appHost,
    capabilities,
  }: Options): Promise<void> {
    const parameterOverrides = [
      `UserPoolName="${userPoolName}"`,
      `UserPoolDomainPrefix="${userPoolDomainPrefix}"`,
      `GoogleClientId="${googleClientId}"`,
      `GoogleClientSecret="${googleClientSecret}"`,
      `CallbackUrls="https://${appHost}"`,
    ].join(' ')

    await deployStack({ profile, region, template, stackName, capabilities, parameterOverrides })
    const stack = await describeStack({ profile, region, stackName })
    saveVariables({
      USER_POOL_ID: stack.Outputs?.find((output) => output.OutputKey === 'UserPool')?.OutputValue || '',
      USER_POOL_CLIENT_ID: stack.Outputs?.find((output) => output.OutputKey === 'UserPoolClient')?.OutputValue || '',
      USER_POOL_DOMAIN: stack.Outputs?.find((output) => output.OutputKey === 'UserPoolDomain')?.OutputValue || '',
    })
  }
}
