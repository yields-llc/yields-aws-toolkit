import BaseCommand from './base.ts'
import { deleteStack } from '../lib/aws/cloudformation.ts'
import type { GlobalOptions } from '../lib/aws/global.ts'

type Options = GlobalOptions & {
  stackName: string
}

export default class DeleteStackCommand extends BaseCommand {
  constructor() {
    super('delete:stack')
    this.description('CloudFormation のスタックを削除します')
    this.requiredOption('--stack-name <stack-name>', 'スタック名を指定します')

    this.action(this.handle)
  }

  private async handle({ profile, region, stackName }: Options): Promise<void> {
    await deleteStack({ profile, region, stackName })
  }
}
