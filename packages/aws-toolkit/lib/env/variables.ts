import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function loadVariables(): Record<string, string> {
  const envFiles = ['.env', `.env.${process.env.NODE_ENV}`, '.env.local']
  for (const envFile of envFiles) {
    const path = join(process.cwd(), envFile)
    if (!existsSync(path)) {
      continue
    }
    const lines = readFileSync(path, 'utf8').split('\n')
    return envVarsToRecords(lines)
  }
  return {}
}

export function saveVariables(variables: Record<string, string>) {
  const envFiles = ['.env', `.env.${process.env.NODE_ENV}`, '.env.local']
  for (const envFile of envFiles) {
    const path = join(process.cwd(), envFile)
    if (!existsSync(path)) {
      continue
    }
    const lines = readFileSync(path, 'utf8').split('\n')
    const envVars = envVarsToRecords(lines)

    for (const [key, value] of Object.entries(variables)) {
      envVars[key] = value
    }
    const contents = Object.entries(envVars)
      .map(([key, value]) => (key.startsWith('#') ? key : `${key}=${value}`))
      .join('\n')

    writeFileSync(path, `${contents}\n`)
    break
  }
}

function envVarsToRecords(lines: string[]) {
  const records: Record<string, string> = {}
  for (const line of lines) {
    if (!line) {
      continue
    }
    const parts = line.split('=')
    if (parts.length < 2) {
      records[line] = ''
      continue
    }
    records[parts[0] || ''] = parts[1] || ''
  }
  return records
}
