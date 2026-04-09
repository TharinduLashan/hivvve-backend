import { pool } from '../../config/db';

export const completeOnboarding = async (userId: string, body: any) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      firstName,
      lastName,
      zipCode,
      city,
      county,
      state,
      providers,
      endorsements,
    } = body;

    const profileRes = await client.query(
      `INSERT INTO profiles 
       (user_id, first_name, last_name, zip_code, city, county, state, is_completed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)
       RETURNING *`,
      [userId, firstName, lastName, zipCode, city, county, state]
    );

    const profile = profileRes.rows[0];

    const providerIds: string[] = [];

    for (const p of providers) {
      const res = await client.query(
        `INSERT INTO profile_providers 
         (profile_id, category, provider_name, google_place_id)
         VALUES ($1,$2,$3,$4)
         RETURNING id`,
        [profile.id, p.category, p.name, p.placeId]
      );

      providerIds.push(res.rows[0].id);
    }

    for (const e of endorsements) {
      const providerId = providerIds[e.providerIndex];

      await client.query(
        `INSERT INTO endorsements (user_id, provider_id, message)
         VALUES ($1,$2,$3)`,
        [userId, providerId, e.message]
      );
    }

    await client.query(
      `UPDATE users SET is_onboarded = true WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    return { success: true };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};