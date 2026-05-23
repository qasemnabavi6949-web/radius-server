import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();

    try { await query("ALTER TABLE dashboard_users ADD COLUMN speedLimit VARCHAR(32) DEFAULT ''"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN dataLimitBytes BIGINT DEFAULT 0"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN dataLimitString VARCHAR(32) DEFAULT ''"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN accountStatus VARCHAR(20) DEFAULT 'Active'"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN chargedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch {}
    
    try { await query("ALTER TABLE dashboard_users ADD COLUMN firstName VARCHAR(64) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN lastName VARCHAR(64) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN email VARCHAR(128) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN phone VARCHAR(20) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN nationalId VARCHAR(20) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN address TEXT DEFAULT NULL"); } catch {}

    try {
      await query(`
        UPDATE dashboard_users du
        JOIN dashboard_profiles dp ON du.\`group\` = dp.name
        SET
           du.dataLimitBytes = IF(dp.totalTraffic IS NOT NULL AND dp.totalTraffic != '', CAST(dp.totalTraffic AS DECIMAL(10,2)) * 1024 * 1024, 0),
           du.dataLimitString = IF(dp.totalTraffic IS NOT NULL AND dp.totalTraffic != '', CONCAT(dp.totalTraffic, ' MB'), 'Unlimited'),
           du.speedLimit = IF(dp.downloadSpeed IS NOT NULL OR dp.uploadSpeed IS NOT NULL, CONCAT(COALESCE(dp.downloadSpeed, '0'), ' / ', COALESCE(dp.uploadSpeed, '0'), ' Kbps'), '')
        WHERE dp.type = 'data';
      `);
    } catch (e) { console.error('Auto-sync failed:', e); }

    const users: any = await query(`
      SELECT du.*,
             COALESCE((SELECT SUM(COALESCE(acctinputoctets, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalInputBytes,
             COALESCE((SELECT SUM(COALESCE(acctoutputoctets, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalOutputBytes,
             COALESCE((SELECT SUM(COALESCE(acctinputoctets, 0) + COALESCE(acctoutputoctets, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalBytesUsed,
             COALESCE((SELECT SUM(COALESCE(acctsessiontime, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalUptime,
             (SELECT acctstoptime FROM radacct WHERE username = du.username ORDER BY radacctid DESC LIMIT 1) as lastSeenOnline,
             CASE WHEN EXISTS (SELECT 1 FROM radacct WHERE username = du.username AND (acctstoptime IS NULL OR acctstoptime = '0000-00-00 00:00:00' OR acctterminatecause = '')) THEN 1 ELSE 0 END as isOnline
      FROM dashboard_users du
      ORDER BY du.id DESC
    `);

    const mappedUsers = users.map((u: any) => {
      const bytes = parseInt(u.totalBytesUsed) || 0;
      const inputBytes = parseInt(u.totalInputBytes) || 0;
      const outputBytes = parseInt(u.totalOutputBytes) || 0;
      const limitBytes = parseInt(u.dataLimitBytes) || 0;
      const limitStr = u.dataLimitString || 'Unlimited';

      const formatBytes = (b: number) => {
        if (b > 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        return (b / (1024 * 1024)).toFixed(2) + ' MB';
      };

      const trafficUsage = `${formatBytes(bytes)} / ${limitStr}`;

      let remainingBytes = -1;
      let remainingStr = 'Unlimited';
      if (limitBytes > 0) {
         remainingBytes = Math.max(0, limitBytes - bytes);
         remainingStr = formatBytes(remainingBytes);
      }

      let finalStatus = u.isOnline ? 'Online' : 'Offline';
      if (u.accountStatus === 'Disabled') {
        finalStatus = 'Disabled';
      }

      return {
        ...u,
        status: finalStatus,
        traffic: trafficUsage,
        bytes,
        inputBytes,
        outputBytes,
        limitBytes,
        formattedInput: formatBytes(inputBytes),
        formattedOutput: formatBytes(outputBytes),
        remainingBytes,
        remainingStr,
        totalUptimeSec: parseInt(u.totalUptime) || 0,
        lastSeenOnline: u.lastSeenOnline ? new Date(u.lastSeenOnline).toLocaleString() : 'N/A'
      };
    });

    return NextResponse.json(mappedUsers);
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const data = await req.json();

    try { await query("ALTER TABLE dashboard_users ADD COLUMN speedLimit VARCHAR(32) DEFAULT ''"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN dataLimitBytes BIGINT DEFAULT 0"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN dataLimitString VARCHAR(32) DEFAULT ''"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN firstName VARCHAR(64) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN lastName VARCHAR(64) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN email VARCHAR(128) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN phone VARCHAR(20) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN nationalId VARCHAR(20) DEFAULT NULL"); } catch {}
    try { await query("ALTER TABLE dashboard_users ADD COLUMN address TEXT DEFAULT NULL"); } catch {}

    let dataLimitBytes = 0;
    let dataLimitString = 'Unlimited';
    let speedLimit = '';
    let price = 0;
    let validityDays = 30;

    if (data.group) {
        const groups: any = await query(`SELECT totalTraffic, downloadSpeed, uploadSpeed, price, validityDays FROM dashboard_profiles WHERE name = ? LIMIT 1`, [data.group]);
        if (groups && groups.length > 0) {
           const g = groups[0];
           if (g.totalTraffic && !isNaN(parseFloat(g.totalTraffic))) {
              dataLimitBytes = parseFloat(g.totalTraffic) * 1024 * 1024;
              dataLimitString = `${g.totalTraffic} MB`;
           }
           if (g.downloadSpeed || g.uploadSpeed) {
              speedLimit = `${g.downloadSpeed || 0} / ${g.uploadSpeed || 0} Kbps`;
           }
           if (g.price) price = parseFloat(g.price) || 0;
           if (g.validityDays) validityDays = parseInt(g.validityDays) || 30;
        }
    }

    await query(`
      INSERT INTO dashboard_users (username, password, firstName, lastName, email, phone, nationalId, address, staticIp, \`group\`, dataLimitBytes, dataLimitString, speedLimit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.username ?? '',
      data.password ?? '',
      data.firstName ?? null,
      data.lastName ?? null,
      data.email ?? null,
      data.phone ?? null,
      data.nationalId ?? null,
      data.address ?? null,
      data.staticIp ?? null,
      data.group ?? null,
      dataLimitBytes,
      dataLimitString,
      speedLimit
    ]);

    const newExp = new Date();
    newExp.setDate(newExp.getDate() + validityDays);
    const newExpStr = newExp.toISOString().slice(0, 19).replace('T', ' ');

    await query(`
      INSERT INTO dashboard_activations (username, firstName, lastName, profile, price, totalPrice, userPrice, oldExpiration, newExpiration)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'N/A', ?)
    `, [data.username ?? '', data.firstName ?? '', data.lastName ?? '', data.group ?? '', price, price, price, newExpStr]);

    await query(`
      INSERT INTO radcheck (username, attribute, op, value)
      VALUES (?, 'Cleartext-Password', ':=', ?)
    `, [data.username ?? '', data.password ?? '']);

    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (error: any) {
    console.error('POST DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
