import dotenv from "dotenv";
import clientFactory from "@ts-cosmos/lib/clientFactory";
import { CosmosClient } from "@azure/cosmos";

dotenv.config();

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint) {
  throw new Error("COSMOS_ENDPOINT is not set");
}
if (!key) {
  throw new Error("COSMOS_KEY is not set");
}

const client = new CosmosClient({ endpoint, key });
const database = client.database("ts-cosmos");
export const cosmos = clientFactory(database);
