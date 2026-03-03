import BaseCommand, { type GlobalOptions } from '@/commands/base.ts'
import { deployStack, describeStack } from '@/lib/aws/cloudformation.ts'

type Options = GlobalOptions & {
  template: string
  stackName: string
  hostedZoneId: string
  aliasName: string
  aliasTarget: string
  capabilities?: string
}

export default class DeployRoute53Command extends BaseCommand {
  constructor() {
    super('deploy:route53')
    this.description('CloudFormation のスタックをデプロイします')
    this.requiredOption('--template <template>', 'テンプレートファイルのパスを指定します', 'cloudformation/route53.yml')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します', `${process.env.STACK_FAMILY}-route53`)
    this.requiredOption('-h,--hosted-zone-id <hosted-zone-id>', 'Route53のホストゾーン名を指定します', process.env.HOSTED_ZONE_ID)
    this.requiredOption('--alias-name <alias-name>', 'Route53のレコード名を指定します', process.env.APP_HOST)
    this.requiredOption('--alias-target <alias-target>', 'Route53のレコード値を指定します', process.env.CLOUDFRONT_DOMAIN_NAME)
    this.option('--capabilities <capabilities>', 'capabilities を指定します', 'CAPABILITY_IAM')

    this.action(this.handle)
  }

  private async handle({ template, profile, region, stackName, hostedZoneId, aliasName, aliasTarget, capabilities }: Options): Promise<void> {
    const parameterOverrides = [`HostedZoneId=${hostedZoneId}`, `AliasName=${aliasName}`, `AliasTarget=${aliasTarget}`].join(' ')

    await deployStack({ profile, region, template, stackName, capabilities, parameterOverrides })
    await describeStack({ profile, region, stackName })
  }
}
