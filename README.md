# Generating fake alerts

## Getting started

1. Install dependecies
`npm i`

2. Change `config.json` and provide credentials for elasticsearch/kibana.

## Commands

### Alerts
`node index.mjs help` - To see the commands list

`node index.mjs generate-alerts <n>` - Generate *n* alerts

`node index.mjs delete-alerts` - Delete all alerts

### Api tests

`node index.mjs test-risk-score` - Test risk score API time response


### Alert document

To modify alert document, you can change `createAlert.mjs` file.


### How to test Risk Score Api

Example list of command for testing Risk Score API woth 10.000 alerts.
```
node index.mjs delete-alerts
node index.mjs generate-alerts 10000
node index.mjs test-risk-score
```

### Setting up your cloud env to report to APM

Needed in both ES and Kibana user settings:
```
elastic:
  apm:
    active: true
    environment: 'ea-benchmarking'
```

### Enabling risk APIs on Kibana

Needed in Kibana user settings:

```
xpack.securitySolution.enableExperimental: ['riskScoringRoutesEnabled', 'riskScoringPersistence']
```

