import BaseCommand, { type GlobalOptions } from '@/commands/base.ts'
import { deployStack, describeStack } from '@/lib/aws/cloudformation.ts'
import { saveVariables } from '@/lib/env/variables.ts'
import { findHostedZoneByName } from '@/lib/aws/route53.ts'

type Options = Omit<GlobalOptions, 'region'> & {
  template: string
  stackName: string
  domain: string
  hostedZoneName: string
  capabilities?: string
}

export default class DeployCertificateCommand extends BaseCommand {
  constructor() {
    super('deploy:certificate')
    this.description('CloudFormation のスタックをデプロイします')
    this.requiredOption('--template <template>', 'テンプレートファイルのパスを指定します', 'cloudformation/certificate.yml')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します', `${process.env.STACK_FAMILY}-certificate`)
    this.option('-d,--domain <domain>', 'ドメイン名を指定します', process.env.CERTIFICATE_DOMAIN)
    this.option('-h,--hosted-zone-name <hosted-zone-name>', 'Route53のホストゾーン名を指定します', process.env.HOSTED_ZONE_NAME)
    this.option('--capabilities <capabilities>', 'capabilities を指定します', 'CAPABILITY_IAM')

    this.action(this.handle)
  }

  private async handle({ template, profile, stackName, domain, hostedZoneName, capabilities }: Options): Promise<void> {
    const hostedZone = await findHostedZoneByName({ profile, hostedZoneName })
    const hostedZoneId = hostedZone.Id.replace('/hostedzone/', '')
    const region = 'us-east-1'

    const parameterOverrides = [`DomainName=${domain}`, `HostedZoneId=${hostedZoneId}`].join(' ')

    await deployStack({ profile, region, template, stackName, capabilities, parameterOverrides })
    const stack = await describeStack({ profile, region, stackName })

    saveVariables({
      HOSTED_ZONE_ID: hostedZoneId,
      CERTIFICATE_ARN: stack.Outputs?.find((output) => output.OutputKey === 'CertificateArn')?.OutputValue || '',
    })
  }
}
