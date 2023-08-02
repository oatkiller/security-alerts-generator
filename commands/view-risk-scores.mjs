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

  const countResponse = await client.count({
    index: indexName
  })
  console.log('Number of documents:', countResponse)

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
