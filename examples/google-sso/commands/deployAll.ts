import BaseCommand from '@yields-llc/aws-toolkit/commands/base'
import type { GlobalOptions } from '@yields-llc/aws-toolkit/lib/aws/global'
import { exec } from '@yields-llc/aws-toolkit/lib/bun/shell'

type Options = GlobalOptions & {}

export default class DeployAllCommand extends BaseCommand {
  constructor() {
    super('deploy:all')
    this.description('CloudFormation のスタックを全てデプロイします')

    this.action(this.handle)
  }

  private async handle({ profile, region }: Options): Promise<void> {
    // Website スタックのデプロイ
    await exec(['bun task deploy:website', `--profile ${profile}`, `--region ${region}`])

    // Certificate スタックのデプロイ
    await exec(['bun task deploy:certificate', `--profile ${profile}`])

    // Cognito スタックのデプロイ
    await exec(['bun task deploy:cognito', `--profile ${profile}`, `--region ${region}`])

    // Authenticator スタックのデプロイ
    await exec(['bun task deploy:authenticator', `--profile ${profile}`])

    // Cloud Front スタックのデプロイ
    await exec(['bun task deploy:cloudfront', `--profile ${profile}`, `--region ${region}`])

    // Route53 スタックのデプロイ
    await exec(['bun task deploy:route53', `--profile ${profile}`, `--region ${region}`])

    console.log('')
    console.log('All stacks deployed successfully')
  }
}
