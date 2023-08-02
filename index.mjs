#! /usr/bin/env node
import { program } from 'commander';
import { generateFakeAlerts, deleteAllAlerts } from './commands/alerts.mjs';
import { fetchRiskScore } from './commands/risk-score.mjs';
import {deleteRiskScores} from './commands/delete-risk-scores.mjs';
import { viewRiskScores } from './commands/view-risk-scores.mjs';


program
  .command('generate-alerts')
  .argument('<n>', 'integer argument', parseInt)
  .description('Generate fake alerts')
  .action(generateFakeAlerts)

program
  .command('delete-alerts')
  .description('Delete all alerts')
  .action(deleteAllAlerts)

program
  .command('test-risk-score')
  .description('Test risk score API')
  .action(fetchRiskScore)

program
  .command('delete-risk-scores')
  .description('Delete Scores persisted by risk score API')
  .action(deleteRiskScores)

program
  .command('view-risk-scores')
  .description('view Scores persisted by risk score API')
  .action(viewRiskScores)

program.parse();
