# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

モノレポ構成。`packages/` に npm パッケージ、`examples/` にその活用例を置く。

| ディレクトリ | 内容 |
|---|---|
| `packages/aws-toolkit/` | npm パッケージ `@yields-llc/aws-toolkit`（GitHub Packages で公開） |
| `examples/google-sso/` | aws-toolkit を使った Google SSO 保護サイトの構築例 |

## packages/aws-toolkit

### コマンド

```bash
cd packages/aws-toolkit

# 依存インストール
bun install

# Lint / Format
bun run lint
bun run format:fix

# パッケージ公開（GitHub Packages）
bun publish
```

### アーキテクチャ

`bin/commander.ts` がエントリポイント。`deploy:stack` と `delete:stack` の2コマンドのみ提供する汎用 CLI パッケージ。

- `commands/base.ts` — `BaseCommand` 抽象クラス。インスタンス化時に `.env` を `process.env` へロードし、`--profile` / `--region` オプションを付与する
- `commands/deployStack.ts` — `deploy:stack` コマンド。`--template` / `--stack-name` などを受け取り `aws cloudformation deploy` を実行
- `commands/deleteStack.ts` — `delete:stack` コマンド。スタック削除 + 完了待機
- `lib/aws/` — AWS CLI 呼び出しのラッパー群（`cloudformation`, `route53`, `cloudfront`, `s3`, `sam`, `lambda`）
- `lib/env/variables.ts` — `loadVariables()` / `saveVariables()` で `.env` を読み書き
- `lib/bun/shell.ts` — Bun Shell でコマンド実行し、pino でログ出力

`lib/aws/global.ts` に共通型 `GlobalOptions`（`profile`, `region`）を定義。

パッケージは `publishConfig` で GitHub Packages (`https://npm.pkg.github.com`) に公開。インストール側の `.npmrc` で `@yields-llc:registry=https://npm.pkg.github.com` の設定が必要。

## examples/google-sso

### コマンド

```bash
cd examples/google-sso

# 依存インストール
bun install

# 全スタックをデプロイ
bun task deploy:all

# 全スタックを削除
bun task delete:all

# 個別デプロイ
bun task deploy:website
bun task deploy:certificate
bun task deploy:cognito
bun task deploy:authenticator
bun task deploy:cloudfront
bun task deploy:route53

# Lint / Format
bun run lint
bun run format:fix
```

Lambda authenticator のビルドは `deploy:authenticator` 実行時に自動で行われるが、手動でも実行可能：

```bash
cd examples/google-sso/lambda/authenticator
bun install
bun run build:js
```

### アーキテクチャ

`@yields-llc/aws-toolkit` の `BaseCommand` を継承した example 固有コマンド群を `commands/` に定義し、`bin/commander.ts` で登録する。

**スタックのデプロイ順序**（依存関係があるため順序厳守）：

1. `deploy:website` — S3 バケット作成・`apps/example-website/index.html` アップロード → `S3_BUCKET_NAME`, `S3_WEBSITE_DOMAIN` を `.env` に保存
2. `deploy:certificate` — ACM 証明書（`us-east-1` 固定） → `HOSTED_ZONE_ID`, `CERTIFICATE_ARN` を `.env` に保存
3. `deploy:cognito` — Cognito User Pool（Google を IdP として設定） → `USER_POOL_ID`, `USER_POOL_CLIENT_ID`, `USER_POOL_DOMAIN` を `.env` に保存
4. `deploy:authenticator` — SAM で Lambda@Edge をビルド・デプロイ（`us-east-1` 固定） → `AUTHENTICATOR_FUNCTION_ARN` を `.env` に保存
5. `deploy:cloudfront` — CloudFront ディストリビューション作成
6. `deploy:route53` — Route53 A レコード作成

各コマンドはスタックの Output を読み取り、次のコマンドが使う値を `.env` に追記する。**自動生成された環境変数は編集・削除しないこと。**

### 環境変数（`.env.example` をコピーして設定）

| 変数名 | 必須 | 説明 |
|---|---|---|
| `AWS_PROFILE` | 任意 | AWS プロファイル名 |
| `AWS_DEFAULT_REGION` | 任意 | リージョン（デフォルト: `ap-northeast-1`） |
| `STACK_FAMILY` | 必須 | 全スタック名の共通プレフィックス |
| `CERTIFICATE_DOMAIN` | 必須 | ACM 証明書のドメイン |
| `HOSTED_ZONE_NAME` | 必須 | Route53 ホストゾーン名 |
| `APP_HOST` | 必須 | アプリのホスト名 |
| `USER_POOL_DOMAIN_PREFIX` | 必須 | Cognito ドメインのプレフィックス |
| `GOOGLE_CLIENT_ID` | 必須 | Google OAuth クライアント ID |
| `GOOGLE_CLIENT_SECRET` | 必須 | Google OAuth クライアントシークレット |

### コードスタイル

Biome で強制：シングルクォート、セミコロンなし、インデント2スペース、行幅160文字。パスエイリアス `@/*` はプロジェクトルートに解決（`examples/google-sso/tsconfig.json`）。
