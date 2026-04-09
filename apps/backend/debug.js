const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const c = await pool.connect();
  const res = await c.query('SELECT * FROM users LIMIT 1');
  const user = res.rows[0];
  console.log("Got user:", user.id, "Tenant:", user.tenant_id);

  // insert link
  let link = await c.query(`
    INSERT INTO links (tenant_id, title, url, position) 
    VALUES ($1, 'test', 'http://test.com', 0) 
    RETURNING *`, [user.tenant_id]);
  link = link.rows[0];
  console.log("Inserted link:", link.id);

  // simulate update
  const updates = ['title = $1', 'url = $2'];
  const values = ['updated', 'http://updated.com', link.id, user.tenant_id];

  await c.query(`SET LOCAL app.current_tenant_id = '${user.tenant_id}'`);
  try {
    const updateRes = await c.query(`
      UPDATE links SET title = $1, url = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `, values);
    console.log("Update res rows:", updateRes.rows.length);
  } catch(e) {
    console.error("Update failed:", e.message);
  }
  
  c.release();
  pool.end();
}
test().catch(console.error);
