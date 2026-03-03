import { exec } from '../bun/shell.ts'
import type { GlobalOptions } from './global'

type DeploySamOptions = GlobalOptions & {
  stackName: string
  template?: string
}

type DeleteSamOptions = GlobalOptions & {
  stackName: string
}

async function buildSam() {
  const commandLines = ['sam build', '--no-cached']
  return exec(commandLines)
}

export async function deploySam({ profile, stackName, template }: DeploySamOptions) {
  await buildSam()
  const commandLines = ['sam deploy', `--stack-name ${stackName}`, '--no-confirm-changeset', '--no-fail-on-empty-changeset']
  if (profile) commandLines.push(`--profile ${profile}`)
  if (template) commandLines.push(`--template-file ${template}`)

  return exec(commandLines)
}

export async function deleteSam({ profile, region, stackName }: DeleteSamOptions) {
  const commandLines = ['sam delete', `--stack-name ${stackName}`, '--no-prompts']
  if (profile) commandLines.push(`--profile ${profile}`)
  if (region) commandLines.push(`--region ${region}`)

  return exec(commandLines)
}
