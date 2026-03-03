import BaseCommand from '@yields-llc/aws-toolkit/commands/base'
import type { GlobalOptions } from '@yields-llc/aws-toolkit/lib/aws/global'
import { deployStack, describeStack } from '@yields-llc/aws-toolkit/lib/aws/cloudformation'
import { saveVariables } from '@yields-llc/aws-toolkit/lib/env/variables'

type Options = GlobalOptions & {
  template: string
  stackName: string
  s3Bucket: string
  s3Domain: string
  certificate: string
  authFunction: string
  cname: string
  enabled: string
  capabilities?: string
}

export default class DeployCloudfrontCommand extends BaseCommand {
  constructor() {
    super('deploy:cloudfront')
    this.description('CloudFormation のスタックをデプロイします')
    this.requiredOption('--template <template>', 'テンプレートファイルのパスを指定します', 'cloudformation/cloudfront.yml')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します', `${process.env.STACK_FAMILY}-cloudfront`)
    this.requiredOption('--s3-bucket <s3-bucket>', 'S3 の バケット名を指定します', process.env.S3_BUCKET_NAME)
    this.requiredOption('--s3-domain <s3-domain>', 'S3 の ドメイン名を指定します', process.env.S3_WEBSITE_DOMAIN)
    this.requiredOption('--certificate <certificate>', 'ACM certificate の ARN を指定します', process.env.CERTIFICATE_ARN)
    this.requiredOption('--auth-function <auth-function>', '認証用 Lambda@Edge 関数の ARN を指定します', process.env.AUTHENTICATOR_FUNCTION_ARN)
    this.requiredOption('--cname <cname>', 'コンテンツを配信するドメインを指定します', process.env.APP_HOST)
    this.requiredOption('--enabled <enabled>', '有効・無効を指定します', 'true')
    this.option('--capabilities <capabilities>', 'capabilities を指定します', 'CAPABILITY_IAM')

    this.action(this.handle)
  }

  private async handle({
    template,
    profile,
    region,
    stackName,
    s3Bucket,
    s3Domain,
    certificate,
    authFunction,
    cname,
    enabled,
    capabilities,
  }: Options): Promise<void> {
    const parameterOverrides = [
      `S3BucketName=${s3Bucket}`,
      `S3DomainName=${s3Domain}`,
      `CertificateArn=${certificate}`,
      `AuthFunctionArn=${authFunction}`,
      `CNAME=${cname}`,
      `Enabled=${enabled}`,
    ].join(' ')
    await deployStack({ profile, region, template, stackName, capabilities, parameterOverrides })
    const stack = await describeStack({ profile, region, stackName })

    saveVariables({
      CLOUDFRONT_DOMAIN_NAME: stack.Outputs?.find((output) => output.OutputKey === 'DomainName')?.OutputValue || '',
    })
  }
}
