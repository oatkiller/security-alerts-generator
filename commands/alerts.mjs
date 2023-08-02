import createAlert from "../createAlert.mjs";
// @ts-ignore
import alertMappings from "../alertMappings.json" assert { type: "json" };
// @ts-ignore
import config from "../config.json" assert { type: "json" };
import {faker} from "@faker-js/faker";
import {client} from "../es-client.mjs";

const ALERT_INDEX = ".alerts-security.alerts-default";

/**
 * @param {number} n - number of alerts to generate
 */
const createDocuments = (n) => {
  return Array(n)
    .fill(null)
    .reduce((acc) => {
      const alert = createAlert();
      acc.push({
        index: { _index: ALERT_INDEX, _id: alert["kibana.alert.uuid"] },
      });
      acc.push(alert);
      return acc;
    }, []);
};

const alertIndexCheck = async () => {
  const isExist = await client.indices.exists({ index: ALERT_INDEX });
  if (isExist) return;

  // @ts-ignore
  console.log("Alert index does not exist, creating...");

  try {
    await client.indices.create({
      index: ALERT_INDEX,
      body: {
        mappings: alertMappings.mappings,
        settings: {
          "index.mapping.total_fields.limit": 2000,
        },
      },
    });
    // @ts-ignore
    console.log("Alert index created");
  } catch (error) {
    // @ts-ignore
    console.log("Alert index creation failed", error);
  }
};

// @ts-ignore
export const generateFakeAlerts = async (n) => {
  const countOfAlertsToGenerate = parseInt(n, 10);
  await alertIndexCheck();

  // @ts-ignore
  console.log("Generating fake alerts...");

  const alertPerMinute = 1_000;

  const totalUserNameCount = Math.min(500_000, countOfAlertsToGenerate);
  const alertsPerUserName = countOfAlertsToGenerate / totalUserNameCount;
  const totalHostNameCount = Math.min(135_000, countOfAlertsToGenerate);
  const alertsPerHostName = countOfAlertsToGenerate / totalHostNameCount


  const endingTime = new Date();

  const startingTime = new Date(
    endingTime.getTime() - (countOfAlertsToGenerate / alertPerMinute) * 60 * 1000
  );

  const duration = endingTime.getTime() - startingTime.getTime();

  const durationInMinutes = duration / 1000 / 60;

  // @ts-ignore
  console.log(
    countOfAlertsToGenerate,
    " alerts will be indexed with @timestamps between ",
    startingTime.toLocaleString(),
    " and ",
    endingTime.toLocaleString()
  );
  // @ts-ignore
  console.log(
    "that is a duration of ",
    durationInMinutes,
    " minutes and at a rate of ",
    alertPerMinute,
    " alerts per minute"
  );

  console.log(totalUserNameCount, " unique usernames will be generated");
  console.log(totalHostNameCount, " unique hostnames will be generated");

  const limitPerBatch = 1_000_000;
  let generated = 0;

  let hostName = faker.internet.domainName();
  let hostNamesGenerated = 1;

  let userName = faker.internet.userName();
  let userNamesGenerated = 1;

  while (generated < countOfAlertsToGenerate) {
    const alertCountForThisBatch = Math.min(limitPerBatch, countOfAlertsToGenerate - generated);

    const docs = [];

    for (let index = generated; index < generated + alertCountForThisBatch; index++) {

      // if the current user name has been used in enough alerts, generate a new one
      if (index + 1> alertsPerUserName * userNamesGenerated) {
        userNamesGenerated++;
        userName = faker.internet.userName();
      }

      // if the current host name has been used in enough alerts, generate a new one
      if (index + 1 > alertsPerHostName * hostNamesGenerated) {
        hostNamesGenerated++;
        hostName = faker.internet.domainName();
      }

      const timestamp = lerpDate(startingTime, endingTime, index / countOfAlertsToGenerate);

      const alert = createAlert({
        hostName,
        userName,
        timestamp: timestamp.getTime(),
      });

      docs.push({
        index: { _index: ALERT_INDEX, _id: alert["kibana.alert.uuid"] },
      });
      docs.push(alert);
    }

    try {
      const result = await client.bulk({ body: docs });
      generated += result.items.length;
      // @ts-ignore
      console.log(
        `${result.items.length} alerts created, ${countOfAlertsToGenerate - generated} left`
      );
    } catch (err) {
      // @ts-ignore
      console.log("Error: ", err);
    }
  }

  // @ts-ignore
  console.log("Finished gerating alerts");
  console.log('Total alerts generated: ', generated);
  console.log('total user names generated: ', userNamesGenerated);
  console.log('total host names generated: ', hostNamesGenerated);
};

export const deleteAllAlerts = async () => {
  // @ts-ignore
  console.log("Deleting all alerts...");
  try {
    // @ts-ignore
    await client.deleteByQuery({
      index: ALERT_INDEX,
      refresh: true,
      body: {
        query: {
          match_all: {},
        },
      },
    });
    console.log("Deleted all alerts");
  } catch (error) {
    // @ts-ignore
    console.log("Failed to delete alerts");
    // @ts-ignore
    console.log(error);
  }
};

/**
 * @param {Date} start
 * @param {Date} end
 * @param {number} t between 0 and 1
 */
function lerpDate(start,end,t) {
  return new Date((1 - t) * start.getTime() + t * end.getTime());
}
