import { generate } from "@genkit-ai/ai";
import { defineFlow } from "@genkit-ai/flow";
import { z } from "zod";
import { Introspect, introspect } from "../introspect";
import { gemini15ProPreview } from "@genkit-ai/vertexai";

const sampleRow = {
  restaurant_link: "g1024186-d6839181",
  restaurant_name: "The Oystercatcher",
  original_location: [
    "Europe",
    "France",
    "Brittany",
    "Ille-et-Vilaine",
    "Saint Marcan",
  ],
  country: "France",
  region: "Brittany",
  province: "Ille-et-Vilaine",
  city: "Saint Marcan",
  address: 7,
  latitude: 48.588,
  longitude: -1.634103,
  claimed: "Claimed",
  awards:
    "Certificate of Excellence 2019, Certificate of Excellence 2018, Certificate of Excellence 2017, Certificate of Excellence 2016",
  popularity_detailed: "#1 of 1 Restaurant in Saint Marcan",
  popularity_generic: "#1 of 1 places to eat in Saint Marcan",
  top_tags: "Cheap Eats, Bar, British, Pub",
  price_level: "€",
  price_range: "€3-€8",
  meals: "Dinner",
  cuisines: "Bar, British, Pub",
  special_diets: "Vegetarian Friendly",
  features:
    "Reservations, Outdoor Seating, Seating, Free off-street parking, Television, Serves Alcohol, Full Bar, Wine and Beer, Table Service",
  vegetarian_friendly: true,
  vegan_options: false,
  gluten_free: false,
  original_open_hours: {
    Mon: ["17:00-20:30"],
    Tue: ["17:00-20:30"],
    Wed: [],
    Thu: ["17:00-20:30"],
    Fri: ["17:00-20:30"],
    Sat: ["17:00-20:30"],
    Sun: ["17:00-20:30"],
  },
  open_days_per_week: 6,
  open_hours_per_week: 21,
  working_shifts_per_week: 6,
  avg_rating: 5,
  total_reviews_count: 115,
  default_language: "English",
  reviews_count_in_default_language: 76,
  excellent: 67,
  very_good: 8,
  average: 0,
  poor: 1,
  terrible: 0,
  food: 4.5,
  service: 5,
  value: 5,
  atmosphere: 5,
  keywords: "chicken curry, mont saint michel, kevin, beer, accueil",
};
const PROMPT_PREFIX = `
You are a SQL developer working on a database. You are tasked to generate an SQL query.

Instructions:

1. You will be given a list of tables in JSON.
2. You will be given a sample row from each table.
3. You will be given an SQL dialect to target.
4. You need to generate an SQL query that will fulfill the requirements of the query given to you.
5. Eliminate any comments or additional information.
6. Eliminate code blocks and markdown from the response.
`;

function generatePrompt(introspection: Introspect, query: string) {
  return `
${PROMPT_PREFIX}

<TableSchemaInJSON>
${JSON.stringify(introspection.tables, null, 2)}
</TableSchemaInJSON>
<TableRestaurantsSampleRow>
${JSON.stringify(sampleRow, null, 2)}
</TableRestaurantsSampleRow>
<SQLDialect>
Postgresql
</SQLDialect>

Query: ${query}
`;
}

export const generateSQL = defineFlow(
  {
    name: "generateSQL",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async ({ query }) => {
    const db_introspection = await introspect();
    const prompt = generatePrompt(db_introspection, query);

    const llmResponse = await generate({
      prompt,
      model: gemini15ProPreview,
      output: {
        format: "json",
        schema: z.object({
          sql: z.string(),
        }),
      },
      config: {
        temperature: 1,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("No output from model");
    }
    return output.sql;
  },
);
