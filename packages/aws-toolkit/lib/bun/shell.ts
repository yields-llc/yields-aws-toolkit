import { $ } from 'bun'
import { logger } from '../log/logger.ts'

export async function exec(commandLines: string[]) {
  const command = commandLines.join(' \\\n')
  logger.info(command)
  try {
    return await $`${{ raw: command }}`
  } catch (e) {
    logger.error(e)
    throw e
  }
}
