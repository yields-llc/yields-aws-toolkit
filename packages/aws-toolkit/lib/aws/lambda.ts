import { exec } from '../bun/shell.ts'
import type { GlobalOptions } from './global'

type PublishVersionOptions = GlobalOptions & {
  functionName: string
}

type PublishVersion = {
  FunctionName: string
  FunctionArn: string
  Version: string
}

type ListLambdaEdgeFunctionsOptions = GlobalOptions & {
  masterArn: string
}

type LambdaEdgeFunction = {
  FunctionName: string
  FunctionArn: string
  MasterArn: string
}

export async function publishVersion({ profile, region, functionName }: PublishVersionOptions) {
  const profileOpt = profile ? `--profile "${profile}"` : ''
  const commandLines = [`aws ${profileOpt}`, 'lambda', 'publish-version', `--function-name "${functionName}"`, `--region ${region}`, '--no-cli-pager']
  return (await exec(commandLines)).json() as PublishVersion
}

export async function listLambdaEdgeFunctionsByMasterArn({ profile, masterArn }: ListLambdaEdgeFunctionsOptions) {
  const commandLines = [
    'aws lambda list-functions',
    '--master-region us-east-1',
    '--function-version ALL',
    `--query 'Functions[?MasterArn == \`${masterArn}\`]'`,
    '--no-cli-pager',
  ]
  if (profile) commandLines.push(`--profile "${profile}"`)
  return (await exec(commandLines)).json() as LambdaEdgeFunction[]
}
