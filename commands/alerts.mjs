import createAlert from "../createAlert.mjs";
// @ts-ignore
import alertMappings from "../alertMappings.json" assert { type: "json" };
// @ts-ignore
import config from "../config.json" assert { type: "json" };
import { faker } from "@faker-js/faker";
import { client } from "../es-client.mjs";

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

/**
 * @param {string} key
 */
function simulations(key) {
  if (key === "demo") {
    return {
      days: 10 / (24 * 60),
      alertsPreMinute: 100,
      uniqueUserNames: 2,
      uniqueHostNames: 600,
    };
  } else if (key === "ent1") {
    return {
      days: 30,
      alertsPreMinute: 1_000,
      uniqueUserNames: 500_000,
      uniqueHostNames: 135_000,
    };
  } else {
    throw new Error("not implemented");
  }
}

// @ts-ignore
export const generateFakeAlerts = async (simulationName) => {
  await alertIndexCheck();

  const simulation = simulations(simulationName);

  // @ts-ignore
  console.log("Generating fake alerts...");

  debugger
  const bulkResults = await client.helpers.bulk({
    datasource: fakeAlertGenerator(simulation),
    onDocument(doc) {
      debugger
      return {
        index: { _index: ALERT_INDEX, _id: doc["kibana.alert.uuid"] },
      };
    },
    onDrop(doc) {
      console.log("dropped a doc!!!!!", doc);
    },
  });

  // @ts-ignore
  console.log("Finished gerating alerts");
  console.log("Bulk Results", bulkResults);
};

export const deleteAllAlerts = async () => {
  // @ts-ignore
  console.log("Deleting all alerts...");
  try {
    // @ts-ignore
    await client.deleteByQuery({
      index: ALERT_INDEX,
      conflicts: "proceed",
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
function lerpDate(start, end, t) {
  return new Date((1 - t) * start.getTime() + t * end.getTime());
}

/**
 * @param {Date} start
 * @param {Date} end
 * @param {number} total
 */
function* lerpedDateGenerator(start, end, total) {
  let index = 0;
  while (index < total) {
    yield lerpDate(start, end, index / total);
    index++;
  }
}

/**
 * @param {number} uniqueCount
 */
function* hostNamesGenerator(uniqueCount) {
  const hostNames = [];
  for (let i = 0; i < uniqueCount; i++) {
    hostNames.push(faker.internet.domainName());
  }
  let index = 0;
  while (true) {
    index++;
    if (index === uniqueCount) {
      index = 0;
    }
    yield hostNames[index];
  }
}

/**
 * @param {number} uniqueCount
 */
function* userNamesGenerator(uniqueCount) {
  const userNames = [];
  for (let i = 0; i < uniqueCount; i++) {
    userNames.push(faker.internet.userName());
  }
  let index = 0;
  while (true) {
    index++;
    if (index === uniqueCount) {
      index = 0;
    }
    yield userNames[index];
  }
}

// @ts-ignore
function* zipGenerators(...generators) {
  outer: while (true) {
    const values = [];
    for (const generator of generators) {
      const result = generator.next();
      if (result.done) {
        break outer;
      }
      values.push(result.value);
    }
    yield values;
  }
}

/**
 * @typedef {{uniqueHostNames: number;uniqueUserNames: number;alertsPreMinute: number;days: number;}} Simulation
 */

/**
 * @param {Simulation} simulation
 */
async function* fakeAlertGenerator(simulation) {
  const startTime = Date.now();
  const batchSize = 36_000;
  const hostNames = hostNamesGenerator(simulation.uniqueHostNames);
  const userNames = userNamesGenerator(simulation.uniqueUserNames);
  const countOfAlertsToGenerate = simulation.alertsPreMinute * 60 * 24 * simulation.days;

  const endingTime = new Date();

  const startingTime = new Date(
    endingTime.getTime() -
      (countOfAlertsToGenerate / simulation.alertsPreMinute) * 60 * 1000
  );

  const dates = lerpedDateGenerator(
    startingTime,
    endingTime,
    countOfAlertsToGenerate
  );

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
    simulation.days,
    " days and at a rate of ",
    simulation.alertsPreMinute,
    " alerts per minute"
  );

  console.log(
    simulation.uniqueUserNames,
    " unique usernames will be generated"
  );
  console.log(
    simulation.uniqueHostNames,
    " unique hostnames will be generated"
  );

  let totalCount = 0;
  let yieldCount = 0;

  for (const [timestamp, hostName, userName] of zipGenerators(
    dates,
    hostNames,
    userNames
  )) {

    const alertToYield = createAlert({
      hostName,
      userName,
      timestamp: timestamp.getTime(),
    });
    yield alertToYield;

    totalCount++;
    yieldCount++;

    if (yieldCount === batchSize) {
      yieldCount = 0;
      console.log(`yielded batch of ${batchSize} alerts. freeing event loop. Remaining alerts to generate: ${countOfAlertsToGenerate - totalCount}`);


      // print the estimated time to completion
      const timeElapsed = Date.now() - startTime;
      const timePerAlert = timeElapsed / totalCount;
      const remainingAlerts = countOfAlertsToGenerate - totalCount;
      const remainingTime = timePerAlert * remainingAlerts;
      const remainingTimeInMinutes = remainingTime / 1000 / 60;

      // print the total number of alerts generated so far, the remaining amount, the percent completed, and the estimated time to completion
      console.log(`Generated ${totalCount} alerts so far. ${remainingAlerts} remaining. ${Math.round(totalCount / countOfAlertsToGenerate * 100)}% completed. Estimated time to completion: ${Math.round(remainingTimeInMinutes)} minutes`);

      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}

export async function viewAlerts() {
  // refresh the alert index
  console.log('refreshing alert index');
  await client.indices.refresh({
    index: ALERT_INDEX,
  });

  // show a count of documents in the alert index
  console.log("count", await client.count({
    index: ALERT_INDEX,
  }));

  
  console.log("unique hostnames", await client.search({
    index: ALERT_INDEX,
    body: {
      size: 0,
      aggs: {
        unique_host_names: {
          cardinality: {
            field: "host.name",
          },
        },
      },
    },
  }));

  // show a count of the unique user names
  console.log("unique user names", await client.search({
    index: ALERT_INDEX,
    body: {
      size: 0,
      aggs: {
        unique_user_names: {
          cardinality: {
            field: "user.name",
          },
        },
      },
    },
  }));

  // show 1 sample alert
  console.log("sample alert", (await client.search({
    index: ALERT_INDEX,
    body: {
      size: 1,
      query: {
        match_all: {},
      },
    },
  })).hits.hits[0]);

}
