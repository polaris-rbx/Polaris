// Export.js
const fs = require("fs");
const r = require("rethinkdbdash")();

const db = r.db("main");

async function exportTable (tbl) {
  const table = await db.table(tbl);
  const fileName = `${tbl}.json`;

  const data = JSON.stringify(table, null, 2);

  fs.writeFile(fileName, data, err => {
    if (err) throw err;
    console.log(`${tbl} table successfully written to file as ${fileName}`);
  });
}

exportTable("servers");
