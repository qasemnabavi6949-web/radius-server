import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest, props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  try {
    const { username } = params;
    
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    
    const action = body.action || 'charge';

    if (action === 'add_traffic') {
       if (!body.bytes) return NextResponse.json({ error: 'Missing bytes' }, { status: 400 });
       await query(`
         UPDATE dashboard_users 
         SET dataLimitBytes = COALESCE(dataLimitBytes, 0) + ?,
             dataLimitString = CONCAT(CAST((COALESCE(dataLimitBytes, 0) + ?) / (1024*1024) AS UNSIGNED), ' MB')
         WHERE username = ?
       `, [body.bytes, body.bytes, username]);
       
       await query(`UPDATE dashboard_users SET accountStatus = 'Active' WHERE username = ?`, [username]);
       await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'`, [username]);
       
       return NextResponse.json({ success: true, message: 'Traffic added' });
    }

    if (action === 'reset_stats') {
       await query(`
         UPDATE dashboard_users 
         SET chargedAt = CURRENT_TIMESTAMP, accountStatus = 'Active'
         WHERE username = ?
       `, [username]);
       await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'`, [username]);
       return NextResponse.json({ success: true, message: 'Stats reset' });
    }

    // Action === 'charge'
    await query(`
      CREATE TABLE IF NOT EXISTS dashboard_activations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64),
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        profile VARCHAR(100),
        price DECIMAL(10, 2),
        totalPrice DECIMAL(10, 2),
        userPrice DECIMAL(10, 2),
        oldExpiration VARCHAR(50),
        newExpiration VARCHAR(50),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reset traffic usage counting to from now
    await query(`
      UPDATE dashboard_users 
      SET chargedAt = CURRENT_TIMESTAMP, accountStatus = 'Active'
      WHERE username = ?
    `, [username]);
    
    await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'`, [username]);

    const userResult: any = await query(`SELECT firstName, lastName, \`group\`, expiration FROM dashboard_users WHERE username = ? LIMIT 1`, [username]);
    if (userResult && userResult.length > 0) {
       const u = userResult[0];
       let price = 0;
       let validityDays = 30; // default
       
       let dataLimitBytes = 0;
       let dataLimitString = 'Unlimited';
       
       if (u.group) {
          const profileResult: any = await query(`SELECT price, validityDays, totalTraffic FROM dashboard_profiles WHERE name = ? LIMIT 1`, [u.group]);
          if (profileResult && profileResult.length > 0) {
             const p = profileResult[0];
             price = parseFloat(p.price) || 0;
             if (p.validityDays !== null && p.validityDays !== undefined && p.validityDays !== '') {
               const parsedDays = parseInt(p.validityDays);
               validityDays = isNaN(parsedDays) ? 30 : parsedDays;
             }
             if (p.totalTraffic && !isNaN(parseFloat(p.totalTraffic))) {
               dataLimitBytes = parseFloat(p.totalTraffic) * 1024 * 1024;
               dataLimitString = `${p.totalTraffic} MB`;
             }
          }
       }
       
       const newExp = new Date();
       newExp.setDate(newExp.getDate() + validityDays);
       const newExpStr = newExp.toISOString().slice(0, 10); 

       await query(`
         UPDATE dashboard_users 
         SET expiration = ?, dataLimitBytes = ?, dataLimitString = ?
         WHERE username = ?
       `, [newExpStr, dataLimitBytes, dataLimitString, username]);

       await query(`
         INSERT INTO dashboard_activations (username, firstName, lastName, profile, price, totalPrice, userPrice, oldExpiration, newExpiration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       `, [username, u.firstName || '', u.lastName || '', u.group || '', price, price, price, u.expiration || 'N/A', newExpStr]);
    }

    return NextResponse.json({ success: true, message: 'User charged successfully' });
  } catch (error) {
    console.error('Error charging user:', error);
    return NextResponse.json({ error: 'Failed to charge user' }, { status: 500 });
  }
}
