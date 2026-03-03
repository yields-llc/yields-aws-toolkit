import { exec } from '../bun/shell.ts'
import type { GlobalOptions } from './global'

type DescribeStackOptions = GlobalOptions & {
  stackName: string
}

type Stack = {
  StackId: string
  StackName: string
  StackStatus: string
  Parameters: {
    ParameterKey: string
    ParameterValue: string
  }[]
  Outputs: {
    OutputKey: string
    OutputValue: string
    ExportName: string
  }[]
}

type DeployStackOptions = GlobalOptions & {
  template: string
  stackName: string
  capabilities?: string
  parameterOverrides?: string
}

type DeleteStackOptions = GlobalOptions & {
  stackName: string
}

export async function deployStack({ profile, region, template, stackName, capabilities, parameterOverrides }: DeployStackOptions) {
  const commandLines = ['aws cloudformation deploy', `--template "${template}"`, `--stack-name "${stackName}"`, `--no-fail-on-empty-changeset`]
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)
  if (capabilities) commandLines.push(`--capabilities ${capabilities}`)
  if (parameterOverrides) commandLines.push(`--parameter-overrides ${parameterOverrides}`)

  await exec(commandLines)
}

export async function describeStack({ profile, region, stackName }: DescribeStackOptions) {
  const commandLines = ['aws cloudformation describe-stacks', `--stack-name "${stackName}"`, '--output json', '--query Stacks[0]']
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  return (await exec(commandLines)).json() as Stack
}

export async function deleteStack({ profile, region, stackName }: DeleteStackOptions) {
  const commandLines = ['aws cloudformation delete-stack', `--stack-name "${stackName}"`]
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  await exec(commandLines)
  return waitForDeleteComplete({ profile, region, stackName })
}

async function waitForDeleteComplete({ profile, region, stackName }: DeleteStackOptions) {
  const commandLines = ['aws cloudformation wait stack-delete-complete', `--stack-name "${stackName}"`]
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  return exec(commandLines)
}

export async function listStacksByName({ profile, region, stackName }: DescribeStackOptions) {
  const commandLines = [
    'aws cloudformation list-stacks',
    '--output json',
    '--stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE',
    `--query 'StackSummaries[?StackName == \`${stackName}\`]'`,
  ]
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  return (await exec(commandLines)).json() as Stack[]
}
