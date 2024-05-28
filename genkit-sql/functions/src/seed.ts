import "dotenv/config";
import { getSql } from "./utils/db";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";

(async function seed() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS restaurants (
      restaurant_link TEXT PRIMARY KEY,
      restaurant_name TEXT NOT NULL,
      original_location TEXT[] NOT NULL,
      country TEXT NOT NULL,
      region TEXT,
      province TEXT,
      city TEXT,
      address TEXT,
      latitude FLOAT,
      longitude FLOAT,
      claimed TEXT,
      awards TEXT,
      popularity_detailed TEXT,
      popularity_generic TEXT,
      top_tags TEXT,
      price_level TEXT,
      price_range TEXT,
      meals TEXT,
      cuisines TEXT,
      special_diets TEXT,
      features TEXT,
      vegetarian_friendly BOOLEAN,
      vegan_options BOOLEAN,
      gluten_free BOOLEAN,
      original_open_hours JSONB,
      open_days_per_week FLOAT,
      open_hours_per_week FLOAT,
      working_shifts_per_week FLOAT,
      avg_rating FLOAT DEFAULT 0,
      total_reviews_count FLOAT DEFAULT 0,
      default_language TEXT,
      reviews_count_in_default_language FLOAT DEFAULT 0,
      excellent FLOAT DEFAULT 0,
      very_good FLOAT DEFAULT 0,
      average FLOAT DEFAULT 0,
      poor FLOAT DEFAULT 0,
      terrible FLOAT DEFAULT 0,
      food FLOAT DEFAULT 0,
      service FLOAT DEFAULT 0,
      value FLOAT DEFAULT 0,
      atmosphere FLOAT DEFAULT 0,
      keywords TEXT
    );
  `;

  const rawCSVData = fs
    .readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "tripadvisor_european_restaurants_sample.csv",
      ),
    )
    .toString();

  const parser = parse({ delimiter: "," });
  const data: Record<string, any>[] = [];
  let count = 0;
  let headers: string[] = [];

  parser.on("readable", () => {
    let record: (string | null)[];
    while ((record = parser.read()) !== null) {
      if (count === 0) {
        headers.push(...(record as string[]));
        count++;
        continue;
      }

      const r: any[] = record.map((value) => (value == "" ? null : value));
      // Parse original_location as an array
      r[2] = JSON.parse(r[2] as string);

      for (let i = 0; i < r.length; i++) {
        // Parse all number values
        if (typeof r[i] === "string" && !isNaN(parseFloat(r[i] as string))) {
          r[i] = parseFloat(r[i] as string);
        }
        // Parse boolean values
        if (typeof r[i] === "string" && (r[i] === "N" || r[i] === "Y")) {
          r[i] = r[i] === "Y";
        }
        // Parse JSON values
        if (typeof r[i] === "string" && r[i].startsWith("{")) {
          r[i] = JSON.parse(r[i]);
        }
      }

      data.push(
        headers.reduce((acc, key, index) => ({ ...acc, [key]: r[index] }), {}),
      );
    }
  });

  const endPromise = new Promise((resolve) => parser.on("end", resolve));

  parser.write(rawCSVData);
  parser.end();

  await endPromise;

  // Insert in chunks of 1000
  const chunkSize = 1000;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    console.log(
      `Inserting chunk ${i / chunkSize + 1} of ${Math.ceil(data.length / chunkSize)}`,
    );

    await sql`
    INSERT INTO restaurants (
      restaurant_link,
      restaurant_name,
      original_location,
      country,
      region,
      province,
      city,
      address,
      latitude,
      longitude,
      claimed,
      awards,
      popularity_detailed,
      popularity_generic,
      top_tags,
      price_level,
      price_range,
      meals,
      cuisines,
      special_diets,
      features,
      vegetarian_friendly,
      vegan_options,
      gluten_free,
      original_open_hours,
      open_days_per_week,
      open_hours_per_week,
      working_shifts_per_week,
      avg_rating,
      total_reviews_count,
      default_language,
      reviews_count_in_default_language,
      excellent,
      very_good,
      average,
      poor,
      terrible,
      food,
      service,
      value,
      atmosphere,
      keywords
    ) VALUES ${sql(
      chunk.map((row) => [
        row.restaurant_link,
        row.restaurant_name,
        row.original_location,
        row.country,
        row.region,
        row.province,
        row.city,
        row.address,
        row.latitude,
        row.longitude,
        row.claimed,
        row.awards,
        row.popularity_detailed,
        row.popularity_generic,
        row.top_tags,
        row.price_level,
        row.price_range,
        row.meals,
        row.cuisines,
        row.special_diets,
        row.features,
        row.vegetarian_friendly,
        row.vegan_options,
        row.gluten_free,
        row.original_open_hours,
        row.open_days_per_week,
        row.open_hours_per_week,
        row.working_shifts_per_week,
        row.avg_rating,
        row.total_reviews_count,
        row.default_language,
        row.reviews_count_in_default_language,
        row.excellent,
        row.very_good,
        row.average,
        row.poor,
        row.terrible,
        row.food,
        row.service,
        row.value,
        row.atmosphere,
        row.keywords,
      ]),
    )};
  `;
  }

  await sql.end();
})();
