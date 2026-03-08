import { exec } from '../bun/shell.ts'
import { logger } from '../log/logger.ts'
import type { GlobalOptions } from './global'

type DescribeStackOptions = GlobalOptions & {
  stackName: string
}

type Stack = {
  StackId: string
  StackName: string
  StackStatus: string
  ChangeSetId: string
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

type ChangeSet = {
  Changes: {
    Type: string
    ResourceChange: {
      Action: string
      LogicalResourceId: string
      PhysicalResourceId: string
      Details: {
        Target: {
          Attribute: string
          Name: string
          RequiresRecreation: string
        }
        Evaluation: string
        ChangeSource: string
      }[]
    }
  }[]
  ChangeSetName: string
  ChangeSetId: string
  StackId: string
  StackName: string
}

type DeployStackOptions = GlobalOptions & {
  template: string
  stackName: string
  capabilities?: string
  parameterOverrides?: string
  noExecuteChangeset?: boolean
}

type ConfirmStackOptions = DeployStackOptions & {}

type DescribeChangeSetOptions = GlobalOptions & {
  stackName: string
  changeSetName: string
}

type DeleteStackOptions = GlobalOptions & {
  stackName: string
}

export async function deployStack({ profile, region, template, stackName, capabilities, parameterOverrides, noExecuteChangeset }: DeployStackOptions) {
  const commandLines = ['aws cloudformation deploy', `--template "${template}"`, `--stack-name "${stackName}"`, `--no-fail-on-empty-changeset`]
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)
  if (capabilities) commandLines.push(`--capabilities ${capabilities}`)
  if (parameterOverrides) commandLines.push(`--parameter-overrides ${parameterOverrides}`)
  if (noExecuteChangeset) commandLines.push('--no-execute-changeset')

  await exec(commandLines)
}

export async function describeStack({ profile, region, stackName }: DescribeStackOptions) {
  const commandLines = ['aws cloudformation describe-stacks', `--stack-name "${stackName}"`, '--output json', '--query Stacks[0]']
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  return (await exec(commandLines)).json() as Stack
}

async function describeChangeSet({ profile, region, stackName, changeSetName }: DescribeChangeSetOptions) {
  const commandLines = ['aws cloudformation describe-change-set', `--stack-name "${stackName}"`, `--change-set-name "${changeSetName}"`, '--output json']
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  return (await exec(commandLines)).json() as ChangeSet
}

export async function confirmChangeset(options: ConfirmStackOptions) {
  await deployStack({ ...options, noExecuteChangeset: true })
  const stack = await describeStack({ profile: options.profile, region: options.region, stackName: options.stackName })
  const changeSet = await describeChangeSet({
    profile: options.profile,
    region: options.region,
    stackName: options.stackName,
    changeSetName: stack.ChangeSetId,
  })
  for (const change of changeSet.Changes) {
    logger.info(change.ResourceChange.LogicalResourceId)
    logger.info(
      `https://${options.region}.console.aws.amazon.com/cloudformation/home?region=${options.region}#/stacks/changesets/changes?stackId=${encodeURI(changeSet.StackId)}&changeSetId=${encodeURI(changeSet.ChangeSetId)}&logicalResourceId=${change.ResourceChange.LogicalResourceId}`,
    )
  }
  return changeSet
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
