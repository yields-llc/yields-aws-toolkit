#!/usr/bin/env bun
import { program } from 'commander'
import DeployWebsiteCommand from '@/commands/deployWebsite'
import DeployCertificateCommand from '@/commands/deployCertificate'
import DeployCognitoCommand from '@/commands/deployCognito'
import DeployAuthenticatorCommand from '@/commands/deployAuthenticator'
import DeployCloudfrontCommand from '@/commands/deployCloudfront'
import DeployRoute53Command from '@/commands/deployRoute53'
import DeleteAllCommand from '@/commands/deleteAll'
import DeployAllCommand from '@/commands/deployAll'

program.name('aws-toolkit').version('1.0.0')
program.addCommand(new DeployWebsiteCommand())
program.addCommand(new DeployCertificateCommand())
program.addCommand(new DeployCognitoCommand())
program.addCommand(new DeployAuthenticatorCommand())
program.addCommand(new DeployCloudfrontCommand())
program.addCommand(new DeployRoute53Command())
program.addCommand(new DeleteAllCommand())
program.addCommand(new DeployAllCommand())

program.parse(process.argv)
