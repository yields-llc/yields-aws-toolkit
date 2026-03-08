import { confirmChangeset } from '../lib/aws/cloudformation.ts'
import type { GlobalOptions } from '../lib/aws/global.ts'
import BaseCommand from './base.ts'

type Options = GlobalOptions & {
  template: string
  stackName: string
  parameterOverrides?: string
  capabilities?: string
  roleArn?: string
}

export default class ConfirmChangeSetCommand extends BaseCommand {
  constructor() {
    super('confirm:change-set')
    this.description('CloudFormation の変更セットを確認します')
    this.requiredOption('--template <template>', 'テンプレートファイルのパスを指定します')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します')
    this.option('--parameter-overrides <parameter-overrides>', '上書きするパラメータを指定します')
    this.option('--capabilities <capabilities>', 'capabilities を指定します', 'CAPABILITY_IAM')
    this.option('--role-arn <role-arn>', '実行する IAM Role の ARN を指定します')

    this.action(this.handle)
  }

  private async handle({ template, profile, region, stackName, parameterOverrides, capabilities }: Options): Promise<void> {
    await confirmChangeset({ profile, region, template, stackName, capabilities, parameterOverrides })
  }
}
