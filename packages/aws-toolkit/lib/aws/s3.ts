import { exec } from '../bun/shell.ts'
import type { GlobalOptions } from './global'

type DeleteBucketPolicyOptions = GlobalOptions & {
  bucketName: string
}

export async function deleteBucketPolicy({ profile, region, bucketName }: DeleteBucketPolicyOptions) {
  const commandLines = ['aws s3api delete-bucket-policy', `--bucket "${bucketName}"`]
  if (profile) commandLines.push(`--profile "${profile}"`)
  if (region) commandLines.push(`--region ${region}`)

  await exec(commandLines)
}
