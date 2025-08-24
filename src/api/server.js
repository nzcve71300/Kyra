require('dotenv').config();
const express = require('express');
const health = require('./routes/health');
const { pool } = require('../db/pool');
const logger = require('../utils/logger');

const app = express();
app.use(express.json());
app.use('/api', health);

// sanity DB check
app.get('/api/db-check', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => logger.info(`API listening on :${port}`));
