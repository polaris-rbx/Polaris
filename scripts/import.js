// Import.js
const r = require("rethinkdbdash")();

const db = r.db("main");

async function importTable (tbl) {
  const t = db.table(tbl);
  let queries = 0;
  const table = {
    get (...args) {
      console.log(`Performing GET: ${queries}`);
      queries++;
      return t.get(...args);
    },
    update (...args) {
      console.log(`Performing UPDATE: ${queries}`);
      return t.update(...args);
    },
    insert (...args) {
      console.log(`Performing INSERT: ${queries}`);
      return t.insert(...args);
    }
  };
  const fileName = `${tbl}.json`;

  const data = require(`./${fileName}`);
  const num = 0;
  for (let counter = 0; counter < data.length; counter++) {
    const item = data[counter];

    const id = item.id ? item.id : item.discordId;
    const existing = await table.get(id);
    if (existing) {
      // Update
      try {
        await table.update(item);
      } catch (err) {
        console.log(`FAILED to update item in ${tbl} ${id}`);
        return;
      }
      console.log(`Updated item in ${tbl} ${id}`);
    } else {
      try {
        await table.insert(item);
      } catch (err) {
        console.log(`FAILED to add item to ${tbl} ${id}`);
        return;
      }
      console.log(`Added item to ${tbl} ${id}`);
    }
  }

  console.log(`Performed ${num} reads...`);
}
importTable("servers");
