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
    } = body;

    // 1️⃣ Create profile
    const profileRes = await client.query(
      `INSERT INTO profiles 
       (user_id, first_name, last_name, zip_code, city, county, state, is_completed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)
       ON CONFLICT (user_id)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         zip_code = EXCLUDED.zip_code,
         city = EXCLUDED.city,
         county = EXCLUDED.county,
         state = EXCLUDED.state,
         is_completed = true
       RETURNING id`,
      [userId, firstName, lastName, zipCode, city, county, state]
    );

    const profileId = profileRes.rows[0].id;

    // 2️⃣ Clear old providers (important for update case)
    await client.query(
      `DELETE FROM profile_providers WHERE profile_id = $1`,
      [profileId]
    );

    // 3️⃣ Insert providers
    for (const p of providers) {
      await client.query(
        `INSERT INTO profile_providers 
         (profile_id, category, provider_name, google_place_id)
         VALUES ($1,$2,$3,$4)`,
        [profileId, p.category, p.name, p.placeId]
      );
    }

    // 4️⃣ Mark user onboarded
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

export const getMyProfile = async (userId: string) => {
  const result = await pool.query(
    `SELECT 
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', pr.id,
        'category', pr.category,
        'name', pr.provider_name,
        'placeId', pr.google_place_id
      )
    ) FILTER (WHERE pr.id IS NOT NULL),
    '[]'
  ) as providers

FROM profiles p
LEFT JOIN profile_providers pr ON pr.profile_id = p.id
WHERE p.user_id = $1
GROUP BY p.id;
    `,
    [userId]
  );

  return result.rows;
};