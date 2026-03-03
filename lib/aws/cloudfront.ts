import type { GlobalOptions } from '@/commands/base.ts'
import { exec } from '@/lib/bun/shell.ts'

type ListResponseHeadersPoliciesOptions = GlobalOptions & {}

export async function listResponseHeadersPolicies({ profile, region }: ListResponseHeadersPoliciesOptions) {
  const commandLines = ['aws cloudfront list-response-headers-policies', '--type custom']
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  await exec(commandLines)
}
