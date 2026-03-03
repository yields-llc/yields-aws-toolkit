# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A CLI toolkit that deploys AWS infrastructure to protect a static website so only specific Google Workspace users can access it. It uses Cognito with Google OAuth as the identity provider and Lambda@Edge for request authentication.

## Commands

```bash
# Install dependencies
bun install

# Run a CLI task
bun task <command>

# Deploy all stacks
bun task deploy:all

# Delete all stacks
bun task delete:all

# Individual deploy commands
bun task deploy:website
bun task deploy:certificate
bun task deploy:cognito
bun task deploy:authenticator
bun task deploy:cloudfront
bun task deploy:route53

# Lint
bunx biome lint

# Format
bunx biome format --write
```

The Lambda authenticator has its own build step run automatically by `deploy:authenticator`, but can be run manually:
```bash
cd lambda/authenticator
bun install
bun run build:js
```

## Architecture

### CLI Entry Point

`bin/commander.ts` registers all commands with Commander.js and is invoked via `bun task`.

### Command Pattern

All commands in `commands/` extend `BaseCommand` (`commands/base.ts`), which:
- Loads `.env` variables into `process.env` on instantiation
- Adds `--profile` and `--region` options defaulting to env vars

Each command wraps AWS CLI calls (via `lib/bun/shell.ts` using Bun Shell) and saves stack outputs back to `.env` for use by subsequent commands.

### Stack Deployment Order

The `deploy:all` command deploys stacks in this required order:
1. **website** — S3 bucket (CloudFormation), uploads `apps/example-website/index.html`
2. **certificate** — ACM certificate in `us-east-1` (required by CloudFront); saves `HOSTED_ZONE_ID`, `CERTIFICATE_ARN` to `.env`
3. **cognito** — Cognito User Pool with Google as IdP; saves `USER_POOL_ID`, `USER_POOL_CLIENT_ID`, `USER_POOL_DOMAIN` to `.env`
4. **authenticator** — SAM-deployed Lambda@Edge function in `us-east-1`; saves `AUTHENTICATOR_FUNCTION_ARN` to `.env`
5. **cloudfront** — CloudFront distribution using the authenticator and certificate
6. **route53** — DNS A record pointing to the CloudFront distribution

### Environment Variables

`.env` is the single source of truth. Required variables are set manually before the first deploy; additional variables (IDs, ARNs) are written automatically by commands after each stack deploys. **Do not edit or delete auto-generated variables.**

Copy `.env.example` to `.env` and populate:
- `STACK_FAMILY` — prefix for all CloudFormation stack names
- `CERTIFICATE_DOMAIN`, `HOSTED_ZONE_NAME`, `APP_HOST`
- `USER_POOL_DOMAIN_PREFIX`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Key Directories

- `commands/` — CLI command classes (one file per command)
- `lib/aws/` — Thin wrappers around AWS CLI (`cloudformation`, `route53`, `cloudfront`, `s3`, `sam`, `lambda`)
- `lib/env/variables.ts` — `loadVariables()` / `saveVariables()` for `.env` read/write
- `cloudformation/` — CloudFormation YAML templates (`s3.yml`, `certificate.yml`, `cognito.yml`, `cloudfront.yml`, `route53.yml`)
- `lambda/authenticator/` — SAM project for the Lambda@Edge authenticator (`cognito-at-edge` library, built to CJS in `dist/`)
- `apps/example-website/` — Static website (`index.html`) uploaded to S3

### Code Style

Enforced by Biome: single quotes, no semicolons, 2-space indent, 160 character line width. Path alias `@/*` resolves to the project root.
