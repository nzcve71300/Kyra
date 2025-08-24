const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  const [rows] = await pool.query('SELECT version FROM schema_version ORDER BY id');
  const applied = new Set(rows.map(r => r.version));

  const dir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const f of files) {
    const version = f.replace('.sql', '');
    if (applied.has(version)) continue;
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log('Applying migration', version);
    await pool.query(sql);
  }
  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
