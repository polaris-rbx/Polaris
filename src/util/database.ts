import * as Sentry from "@sentry/node";
import { Pool, types } from "pg";

const { SYNC } = process.env;

types.setTypeParser(types.builtins.INT8, val => parseInt(val, 10));

export class Database {
  private pool: Pool;

  constructor () {
    this.pool = new Pool();
    console.log("Database starting...");

    this.pool.on("error", err => {
      console.error("Unexpected error on idle client", err);
      Sentry.captureException(err);
    });
    this.init().catch(Sentry.captureException);
  }

  /**
     * Checks that the tables exist, and creates them if sync variable allows.
     */
  private async init () {
    const res = await this.pool.query("SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';");
    if (!res.rows.includes("server")) {
      if (SYNC) {
        /*
           SQL:
            */
        const serversCreate = "";
        await this.pool.query(serversCreate);
      } else {
        console.log("WARNING: Servers does not exist and SYNC is disabled");
      }
    }
  }
}
export default new Database();
