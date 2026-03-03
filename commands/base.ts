import { Command } from 'commander'
import { loadVariables } from '@/lib/env/variables.ts'

export type GlobalOptions = {
  profile: string
  region?: string
}

export default abstract class BaseCommand extends Command {
  protected constructor(name: string) {
    super(name)
    Object.assign(process.env, loadVariables())
    this.option('--profile <profile>', 'AWSプロファイル名を指定します', process.env.AWS_PROFILE)
    this.option('--region <region>', 'リージョンを指定します', process.env.AWS_DEFAULT_REGION || 'ap-northeast-1')
  }
}
