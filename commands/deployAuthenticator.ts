import { $ } from 'bun'
import BaseCommand, { type GlobalOptions } from '@/commands/base.ts'
import { exec } from '@/lib/bun/shell.ts'
import { deploySam } from '@/lib/aws/sam.ts'
import { describeStack } from '@/lib/aws/cloudformation.ts'
import { publishVersion } from '@/lib/aws/lambda.ts'
import { CommanderError } from 'commander'
import { saveVariables } from '@/lib/env/variables.ts'

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
