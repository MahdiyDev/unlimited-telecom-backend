const { Pool } = require("pg");
const { dbUrl } = require("../config");

const pool = new Pool({
  connectionString: dbUrl,
});

const pg = async (SQL, params) => {
  const client = await pool.connect();
  try {
    const {
      rows: [row],
    } = await client.query(SQL, params);
    return row;
  } finally {
    client.release();
  }
};

const pgAll = async (SQL, params) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(SQL, params);
    return rows;
  } finally {
    client.release();
  }
};

module.exports = { pg, pgAll };
