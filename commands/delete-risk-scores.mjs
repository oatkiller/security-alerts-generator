import {client} from "../es-client.mjs";

export async function deleteRiskScores() {
  const indexName = 'risk-score.risk-score-default';
  console.log('Attempting to delete index:', indexName);
  try {
    const response = await client.indices.deleteDataStream({
      name: indexName
    });
    console.log('Index deleted successfully', response);
  } catch (error) {
    console.error("An error occurred while deleting the index:", error);
  }
}

