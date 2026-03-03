import BaseCommand from '@yields-llc/aws-toolkit/commands/base'
import type { GlobalOptions } from '@yields-llc/aws-toolkit/lib/aws/global'
import { deleteStack, listStacksByName } from '@yields-llc/aws-toolkit/lib/aws/cloudformation.ts'
import { exec } from '@yields-llc/aws-toolkit/lib/bun/shell.ts'
import { deleteSam } from '@yields-llc/aws-toolkit/lib/aws/sam.ts'
import { listLambdaEdgeFunctionsByMasterArn } from '@yields-llc/aws-toolkit/lib/aws/lambda.ts'

type Options = GlobalOptions & {}

export default class DeleteAllCommand extends BaseCommand {
  constructor() {
    super('delete:all')
    this.description('CloudFormation のスタックを全て削除します')

    this.action(this.handle)
  }

  private async handle({ profile, region }: Options): Promise<void> {
    // Route53 スタックの削除
    await deleteStack({
      profile,
      region,
      stackName: `${process.env.STACK_FAMILY}-route53`,
    })

    // Cloud Front スタックの削除
    await this.deleteCloudfront({ profile, region })

    // Cognito スタックの削除
    await deleteStack({
      profile,
      region,
      stackName: `${process.env.STACK_FAMILY}-cognito`,
    })

    // Certificate スタックの削除
    await deleteStack({
      profile,
      region: 'us-east-1',
      stackName: `${process.env.STACK_FAMILY}-certificate`,
    })

    // Website スタックの削除
    await this.deleteWebsite({ profile, region })

    // Authenticator スタックの削除
    await this.deleteAuthenticator({ profile })

    console.log('')
    console.log('All stacks deleted successfully')
  }

  private async deleteCloudfront({ profile, region }: Options): Promise<void> {
    const stacks = await listStacksByName({ profile, region, stackName: `${process.env.STACK_FAMILY}-cloudfront` })
    if (stacks.length === 0) {
      return
    }
    // CloudFront Distribution を無効にする
    await exec(['bun task deploy:cloudfront', '--auth-function=""', '--enabled=false'])

    // CloudFront スタックの削除
    await deleteStack({
      profile,
      region,
      stackName: `${process.env.STACK_FAMILY}-cloudfront`,
    })
  }

  private async deleteWebsite({ profile, region }: Options): Promise<void> {
    // S3 バケットを空にする
    await exec(['aws s3 rm', `s3://${process.env.S3_BUCKET_NAME}`, '--recursive'])

    // Website スタックの削除
    await deleteStack({
      profile,
      region,
      stackName: `${process.env.STACK_FAMILY}-website`,
    })
  }

  private async deleteAuthenticator({ profile }: Options): Promise<void> {
    const MAX_RETRY = 20
    for (let retryCount = MAX_RETRY; retryCount > 0; retryCount--) {
      const lambdaEdgeFunctions = await listLambdaEdgeFunctionsByMasterArn({ profile, masterArn: process.env.AUTHENTICATOR_FUNCTION_ARN || '' })
      if (lambdaEdgeFunctions.length === 0) {
        // 削除前にさらに5分待つ
        console.log('Waiting 5 minutes for lambda edge replica functions to be fully deleted...')
        await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000))
        // 削除
        await deleteSam({ profile, region: 'us-east-1', stackName: `${process.env.STACK_FAMILY}-authenticator` })
        return
      }
      if (retryCount > 1) {
        // 30秒待つ
        console.log(`Waiting for lambda edge replica functions to be deleted... (Attempt ${MAX_RETRY - retryCount + 1}/${MAX_RETRY})`)
        await new Promise((resolve) => setTimeout(resolve, 30 * 1000))
      }
    }
  }
}
