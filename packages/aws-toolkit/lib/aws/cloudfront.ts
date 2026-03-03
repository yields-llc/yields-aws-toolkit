import { exec } from '../bun/shell.ts'
import type { GlobalOptions } from './global'

type ListResponseHeadersPoliciesOptions = GlobalOptions & {}

export async function listResponseHeadersPolicies({ profile, region }: ListResponseHeadersPoliciesOptions) {
  const commandLines = ['aws cloudfront list-response-headers-policies', '--type custom']
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  await exec(commandLines)
}
