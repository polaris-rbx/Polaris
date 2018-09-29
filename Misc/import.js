// Import.js
const r = require('rethinkdbdash')();
const db = r.db('main');

function importTable(tbl) {
	const table = db.table(tbl);
	const fileName = tbl + ".json";

	const data = require('./' + fileName);
	data.forEach(async function (item) {
		if (await table.get(item.id || item.discordId)) {
			// Update
			try {
				await table.update(item);
			} catch (err) {
				console.log(`FAILED to update item ${item.id || item.discordId}`);
				return;
			}
			console.log(`Updated item ${item.id || item.discordId}`);

		} else {
			try {
				await table.insert(item);
			} catch (err) {
				console.log(`FAILED to add item ${item.id || item.discordId}`);
				return;
			}
			console.log(`Added item ${item.id || item.discordId}`);
		}
	});

}
importTable('users');
importTable('servers');
