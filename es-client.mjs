import { Client } from "@elastic/elasticsearch";
import config from "./config.json" assert { type: "json" };

const configuration = {
  node: config.elastic.node,
  auth: {
    username: config.elastic.username,
    password: config.elastic.password,
  },
}

if (config.elastic.cloud?.id) {
  configuration.cloud = {
    id: config.elastic.cloud?.id,
  }
}

export const client = new Client(configuration);

