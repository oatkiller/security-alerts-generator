import { Client } from "@elastic/elasticsearch";
import config from "./config.json" assert { type: "json" };

export const client = new Client({
  cloud: {
    id: config.elastic.cloud?.id,
  },
  node: config.elastic.node,
  auth: {
    username: config.elastic.username,
    password: config.elastic.password,
  },
});

