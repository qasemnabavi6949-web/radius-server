const { query, initDb } = require('./lib/db');

async function syncDailyTraffic() {
  try {
    await initDb();
    // محاسبه مصرف امروز بر اساس بایت و تبدیل به فرمت متنی مورد نظر فرانت‌اَند
    await query(`
      UPDATE dashboard_users du
      JOIN (
        SELECT username, SUM(COALESCE(acctinputoctets, 0) + COALESCE(acctoutputoctets, 0)) as today_bytes
        FROM radacct
        WHERE acctstarttime >= CURDATE()
        GROUP BY username
      ) a ON du.username = a.username
      SET du.daily_usage = CONCAT(ROUND(a.today_bytes / 1024 / 1024, 2), ' MB');
    `);
    console.log('Daily usage successfully synced to dashboard.');
  } catch (err) {
    console.error('Error syncing traffic:', err);
  }
}

syncDailyTraffic().then(() => process.exit(0));
