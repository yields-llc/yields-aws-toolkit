# yields-aws-toolkit
AWS上にインフラを構築するツールとその活用例を集めたプロジェクトです。

## 🔧 ツール

### aws-toolkit
`CloudFormation` テンプレートを `AWS CLI` / `Bun Shell` / `TypeScript` でデプロイする `npm` パッケージです。

[→ 詳細](./packages/aws-toolkit/README.md)

## 🗒️ 活用例

### Google SSO
静的サイトを `Cognito` + `Google SSO` で保護しつつ、`CloudFront` + `Certificate Manager` でコンテンツを HTTPS 配信します。

[→ 詳細](./examples/google-sso/README.md)
