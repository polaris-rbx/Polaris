import * as Sentry from "@sentry/node";
import { promises } from "fs";
import { join } from "path";
import { Pool, types } from "pg";

const { readFile } = promises;
const { SYNC } = process.env;

types.setTypeParser(types.builtins.INT8, val => parseInt(val, 10));
const CREATE_SQL_PATH = join(__dirname, "..", "..", "ddl.sql");

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
    if (SYNC) {
      try {
        const sql = await readFile(CREATE_SQL_PATH, "utf8");
        await this.pool.query(sql);
      } catch (e) {
        console.error(`Sync failed! Error:`);
        console.log(e);
      }
    }
  }
}
export default new Database();
