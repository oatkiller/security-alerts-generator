
import {URL} from 'node:url';
import fetch, { Headers } from 'node-fetch';
import config from '../config.json'  assert { type: "json" };

export const fetchRiskScore = async () => {
  let afterKeys;
  console.time('Risk Score total time:')

  for (const identifierType of ['user', 'host']) {
    console.time(`Risk Score ${identifierType} time:`)
    while (true) {
      let headers = new Headers();
    
      headers.append('Content-Type', 'application/json');
      headers.append('kbn-xsrf', 'true');
      headers.set('Authorization', 'Basic ' + Buffer.from(config.kibana.username + ":" + config.kibana.password).toString('base64'));
      console.time('Risk Score Api took:')
      const response = await fetch( new URL('/api/risk_scores/calculation', config.kibana.node), {
        "headers": headers,
        "body": JSON.stringify({
          data_view_id: ".alerts-security.alerts-default,apm-*-transaction*,auditbeat-*,endgame-*,filebeat-*,logs-*,packetbeat-*,traces-apm*,winlogbeat-*,-*elastic-cloud-logs-*",
          identifier_type: identifierType,
          after_keys: afterKeys,
          page_size: 32768,
          range: {
            //start: "n//ow-10y",
            start: "2022-08-02T15:02:06.898Z",
            end: "2024-08-02T15:02:06.898Z",
            //end: "now",
          }
        }),
        "method": "POST",
      });
      console.timeEnd('Risk Score Api took:');
      const responseJson = await response.json()
      console.log('responseJson', JSON.stringify(responseJson,undefined,'\t'));
      if (Object.keys(responseJson.after_keys).length !== 0) {
        afterKeys = responseJson.after_keys;
        console.log('there are more scores to process. lets do it: ', JSON.stringify(afterKeys,undefined,'\t'));
      } else {
        break
      }
    }
    console.timeEnd(`Risk Score ${identifierType} time:`)
  }
  console.timeEnd('Risk Score total time:')
}

/*
export const riskScoreCalculationRequestSchema = t.exact(
  t.intersection([
    t.type({
      data_view_id: DataViewId,
      identifier_type: identifierTypeSchema,
      range: t.type({
        start: t.string,
        end: t.string,
      }),
    }),
    t.partial({
      after_keys: afterKeysSchema,
      debug: t.boolean,
      filter: t.unknown,
      page_size: t.number,
      weights: riskWeightsSchema,
    }),
  ])
);

*/
