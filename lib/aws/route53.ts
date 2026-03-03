import { exec } from '@/lib/bun/shell'
import type { GlobalOptions } from '@/commands/base'

type FindHostedZoneByNameOptions = Omit<GlobalOptions, 'region'> & {
  hostedZoneName: string
}

type HostedZone = {
  Id: string
  Name: string
}

export async function findHostedZoneByName({ profile, hostedZoneName }: FindHostedZoneByNameOptions) {
  const profileOpt = profile ? `--profile "${profile}"` : ''
  const commandLines = [
    `aws ${profileOpt}`,
    'route53',
    'list-hosted-zones-by-name',
    `--dns-name "${hostedZoneName}"`,
    '--query HostedZones[0]',
    '--no-cli-pager',
  ]
  return (await exec(commandLines)).json() as HostedZone
}
