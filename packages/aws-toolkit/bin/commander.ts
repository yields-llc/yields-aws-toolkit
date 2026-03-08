#!/usr/bin/env bun
import { program } from 'commander'
import ConfirmChangeSetCommand from '../commands/confirmChangeSet.ts'
import DeleteStackCommand from '../commands/deleteStack'
import DeployStackCommand from '../commands/deployStack'

program.name('aws-toolkit').version('1.0.0')
program.addCommand(new ConfirmChangeSetCommand())
program.addCommand(new DeleteStackCommand())
program.addCommand(new DeployStackCommand())

program.parse(process.argv)
