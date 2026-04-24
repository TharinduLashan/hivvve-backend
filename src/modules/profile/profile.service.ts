import { pool } from '../../config/db';

export const completeOnboarding = async (userId: string, body: any) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (!userRes.rows.length) {
      throw new Error('User not found');
    }

    const role = userRes.rows[0].role;

    const {
      firstName,
      lastName,
      zipCode,
      city,
      county,
      state,
    } = body;

    await client.query(
      `INSERT INTO profile 
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
         is_completed = true`,
      [userId, firstName, lastName, zipCode, city, county, state]
    );

    if (role === 'homeowner') {
      const { providers = [] } = body;

      await client.query(
        `DELETE FROM homeowner_providers WHERE homeowner_id = $1`,
        [userId]
      );

      for (const p of providers) {
        let providerId = null;

        const existingProvider = await client.query(
          `SELECT id FROM providers WHERE place_id = $1`,
          [p.placeId]
        );

        if (existingProvider.rows.length) {
          providerId = existingProvider.rows[0].id;
        } else {
          const newProvider = await client.query(
            `INSERT INTO providers (id, name, place_id, service_id)
             VALUES (uuid_generate_v4(), $1, $2, $3)
             RETURNING id`,
            [p.name, p.placeId, p.serviceId]
          );

          providerId = newProvider.rows[0].id;
        }

        await client.query(
          `INSERT INTO homeowner_providers 
           (id, homeowner_id, provider_id, service_id, endorsement)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
          [userId, providerId, p.serviceId, p.endorsement || null]
        );
      }
    }

    if (role === 'professional') {
      const {
        businessName,
        serviceId,
        description,
        website,
        logoUrl,
        serviceAreas = [],
      } = body;

      await client.query(
        `INSERT INTO professional_profiles 
         (user_id, business_name, service_id, description, website, logo_url)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (user_id)
         DO UPDATE SET
           business_name = EXCLUDED.business_name,
           service_id = EXCLUDED.service_id,
           description = EXCLUDED.description,
           website = EXCLUDED.website,
           logo_url = EXCLUDED.logo_url`,
        [userId, businessName, serviceId, description, website, logoUrl]
      );

      await client.query(
        `DELETE FROM professional_service_areas WHERE professional_id = $1`,
        [userId]
      );

      for (const zip of serviceAreas) {
        await client.query(
          `INSERT INTO professional_service_areas (id, professional_id, zip_code)
           VALUES (uuid_generate_v4(), $1, $2)`,
          [userId, zip]
        );
      }
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

export const updateProfile = async (userId: string, body: any) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (!userRes.rows.length) {
      throw new Error('User not found');
    }

    const role = userRes.rows[0].role;

    const {
      firstName,
      lastName,
      zipCode,
      city,
      county,
      state,
    } = body;

    if (
      firstName ||
      lastName ||
      zipCode ||
      city ||
      county ||
      state
    ) {
      await client.query(
        `INSERT INTO profile 
        (user_id, first_name, last_name, zip_code, city, county, state)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (user_id)
        DO UPDATE SET
          first_name = COALESCE(EXCLUDED.first_name, profile.first_name),
          last_name = COALESCE(EXCLUDED.last_name, profile.last_name),
          zip_code = COALESCE(EXCLUDED.zip_code, profile.zip_code),
          city = COALESCE(EXCLUDED.city, profile.city),
          county = COALESCE(EXCLUDED.county, profile.county),
          state = COALESCE(EXCLUDED.state, profile.state),
          updated_at = CURRENT_TIMESTAMP`,
        [userId, firstName, lastName, zipCode, city, county, state]
      );
    }
    
    if (role === 'homeowner' && body.providers) {
      const providers = body.providers;

      await client.query(
        `DELETE FROM homeowner_providers WHERE homeowner_id = $1`,
        [userId]
      );

      for (const p of providers) {
        let providerId = null;

        const existing = await client.query(
          `SELECT id FROM providers WHERE place_id = $1`,
          [p.placeId]
        );

        if (existing.rows.length) {
          providerId = existing.rows[0].id;
        } else {
          const inserted = await client.query(
            `INSERT INTO providers (id, name, place_id, service_id)
             VALUES (uuid_generate_v4(), $1, $2, $3)
             RETURNING id`,
            [p.name, p.placeId, p.serviceId]
          );

          providerId = inserted.rows[0].id;
        }

        await client.query(
          `INSERT INTO homeowner_providers 
           (id, homeowner_id, provider_id, service_id, endorsement)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
          [userId, providerId, p.serviceId, p.endorsement || null]
        );
      }
    }

    if (role === 'professional') {
      const {
        businessName,
        serviceId,
        description,
        website,
        logoUrl,
        serviceAreas,
      } = body;

      if (
        businessName ||
        serviceId ||
        description ||
        website ||
        logoUrl
      ) {
        await client.query(
          `INSERT INTO professional_profiles 
           (user_id, business_name, service_id, description, website, logo_url)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (user_id)
           DO UPDATE SET
             business_name = COALESCE(EXCLUDED.business_name, professional_profiles.business_name),
             service_id = COALESCE(EXCLUDED.service_id, professional_profiles.service_id),
             description = COALESCE(EXCLUDED.description, professional_profiles.description),
             website = COALESCE(EXCLUDED.website, professional_profiles.website),
             logo_url = COALESCE(EXCLUDED.logo_url, professional_profiles.logo_url)`,
          [userId, businessName, serviceId, description, website, logoUrl]
        );
      }

      if (Array.isArray(serviceAreas)) {
        // reset
        await client.query(
          `DELETE FROM professional_service_areas WHERE professional_id = $1`,
          [userId]
        );

        for (const zip of serviceAreas) {
          await client.query(
            `INSERT INTO professional_service_areas (id, professional_id, zip_code)
             VALUES (uuid_generate_v4(), $1, $2)`,
            [userId, zip]
          );
        }
      }
    }

    await client.query('COMMIT');

    return { success: true };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};