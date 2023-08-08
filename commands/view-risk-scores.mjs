import {client} from "../es-client.mjs";

export async function viewRiskScores() {
  const indexName = 'risk-score.risk-score-default';

  try {
  await client.indices.refresh({
    index: indexName
  })
  } catch (error) {
    console.error("An error occurred while refreshing the index:", error);
    throw new Error(error);
  }

  for (const identifierField of ['host.name', 'user.name']) {
    const countResponse = await client.count({
      index: indexName,
      "query": {
        "exists": {
          "field": identifierField
        }
      }
    })
    console.log(`Number of documents with : ${identifierField}`, countResponse)
  }

  // run the _stats API to get data about the size of the index
  const statsResponse = await client.indices.stats({
    index: indexName
  })

  // print the result of the stats call
  console.log('Stats: ',JSON.stringify(statsResponse,undefined,'\t'))


  console.log('Querying index:', indexName);
  try {
    const response = await client.search({
      index: indexName,
      body: {
        size: 5,
        sort: [
          {
            "@timestamp": {
              order: "desc"
            }
          }
        ]
      }
    })
    console.log("response", JSON.stringify(response,undefined,'\t'));
  } catch (error) {
    console.error("An error occurred while querying the index:", error);
  }
}
