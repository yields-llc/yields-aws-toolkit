import { $ } from 'bun'
import BaseCommand from '@yields-llc/aws-toolkit/commands/base'
import type { GlobalOptions } from '@yields-llc/aws-toolkit/lib/aws/global'
import { simpleHash } from '@/lib/hash'
import { saveVariables } from '@yields-llc/aws-toolkit/lib/env/variables.ts'
import { deployStack, describeStack } from '@yields-llc/aws-toolkit/lib/aws/cloudformation.ts'

type Options = GlobalOptions & {
  template: string
  stackName: string
  bucketName: string
  capabilities: string
}

type Output = {
  OutputKey: string
  OutputValue: string
  ExportName: string
}

export default class DeployWebsiteCommand extends BaseCommand {
  constructor() {
    super('deploy:website')
    this.description('CloudFormation のスタックをデプロイします')
    this.requiredOption('--bucket-name <bucket-name>', 'S3のバケット名を指定します', '')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します', `${process.env.STACK_FAMILY}-website`)
    this.requiredOption('--template <template>', 'テンプレートファイルのパスを指定します', 'cloudformation/s3.yml')
    this.option('--capabilities <capabilities>', 'capabilities を指定します', 'CAPABILITY_IAM')

    this.action(this.handle)
  }

  private async handle({ profile, region, template, stackName, bucketName, capabilities }: Options): Promise<void> {
    if (!bucketName) {
      bucketName = `${stackName}-${simpleHash(process.cwd())}`
    }

    // Deploy S3 CloudFormation stack
    const parameterOverrides = [`BucketName=${bucketName}`].join(' ')
    await deployStack({ profile, region, template, stackName, parameterOverrides, capabilities })

    // Upload index.html to S3
    console.log('Uploading index.html to S3...')
    await $`aws s3 cp apps/example-website/index.html s3://${bucketName}/index.html`

    // Get website Domain
    const outputs = (await describeStack({ profile, region, stackName })).Outputs as Output[]

    const s3BucketName = outputs.find((o) => o.OutputKey === 'BucketName')?.OutputValue || ''
    const websiteDomain = outputs.find((o) => o.OutputKey === 'WebsiteRegionalDomain')?.OutputValue || ''

    console.log('')
    console.log('Deployment complete!')
    console.log(`Website Domain: ${websiteDomain}`)

    saveVariables({
      S3_BUCKET_NAME: s3BucketName,
      S3_WEBSITE_DOMAIN: websiteDomain,
    })
  }
}
