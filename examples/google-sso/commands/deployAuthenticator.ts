import { $ } from 'bun'
import BaseCommand from '@yields-llc/aws-toolkit/commands/base'
import type { GlobalOptions } from '@yields-llc/aws-toolkit/lib/aws/global'
import { exec } from '@yields-llc/aws-toolkit/lib/bun/shell'
import { deploySam } from '@yields-llc/aws-toolkit/lib/aws/sam.ts'
import { describeStack } from '@yields-llc/aws-toolkit/lib/aws/cloudformation.ts'
import { publishVersion } from '@yields-llc/aws-toolkit/lib/aws/lambda.ts'
import { CommanderError } from 'commander'
import { saveVariables } from '@yields-llc/aws-toolkit/lib/env/variables.ts'

type Options = Omit<GlobalOptions, 'region'> & {
  cwd: string
  stackName: string
  template?: string
  capabilities?: string
}

export default class DeployAuthenticatorCommand extends BaseCommand {
  constructor() {
    super('deploy:authenticator')
    this.description('CloudFormation のスタックをデプロイします')
    this.requiredOption('-c,--cwd <cwd>', '作業ディレクトリを指定します', 'lambda/authenticator')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します', `${process.env.STACK_FAMILY}-authenticator`)
    this.option('--template <template>', 'テンプレートファイルのパスを指定します')
    this.option('--capabilities <capabilities>', 'capabilities を指定します', 'CAPABILITY_IAM')

    this.action(this.handle)
  }

  private async handle({ cwd, profile, stackName, template }: Options): Promise<void> {
    $.cwd(cwd)
    await exec(['bun install'])
    await exec(['bun build:js'])
    await deploySam({ profile, stackName, template })
    const outputs = (await describeStack({ profile, region: 'us-east-1', stackName })).Outputs
    const functionName = outputs.find((output) => output.OutputKey === 'AuthenticatorFunction')?.OutputValue
    if (!functionName) {
      throw new CommanderError(1, 'error', `AuthenticatorFunction の Output が見つかりませんでした`)
    }
    const { FunctionArn } = await publishVersion({ profile, region: 'us-east-1', functionName })

    saveVariables({
      AUTHENTICATOR_FUNCTION_ARN: FunctionArn,
    })
  }
}
