import { Query, VectorQuery } from "@google-cloud/firestore";
import * as admin from "firebase-admin";
import { WhereFilterOp } from "@google-cloud/firestore";
import { z } from "zod";

// Define a schema for the operators
const operatorSchema = z.enum([
  "<",
  "<=",
  "==",
  "!=",
  ">=",
  ">",
  "array-contains",
  "in",
  "not-in",
  "array-contains-any",
]);

// Define a schema for prefilters
export const prefilterSchema = z.object({
  field: z.string(),
  operator: operatorSchema,
  value: z.string(),
});

// Parse limit function with improved error handling
export const parseLimit = (limit: unknown): number => {
  if (typeof limit !== "string" && typeof limit !== "number") {
    throw new Error("The limit must be a string or a number");
  }

  const parsedFloat = parseFloat(limit as string);
  const isInteger = Number.isInteger(parsedFloat);

  if (!isInteger || parsedFloat < 1) {
    throw new Error("The limit must be an integer greater than 0");
  }

  return parseInt(limit as string, 10);
};

// Define a schema for the query
const querySchema = z
  .object({
    query: z.string(),
    limit: z.union([z.string(), z.number()]).optional(),
    prefilters: z.array(prefilterSchema).optional(),
  })
  .refine((data) => data.query !== undefined, {
    message: "The query field must be provided",
  });

// Interface for parsed requests
export interface ParsedRequest {
  query: string; // This must always be provided, aligning with your Zod schema
  limit?: string | number;
  prefilters?: Prefilter[];
}

// Parse the query schema
export const parseQuerySchema = (data: unknown): ParsedRequest => {
  return querySchema.parse(data);
};

// Interface for prefilters
export interface Prefilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

// Firestore vector store client class
export class FirestoreVectorStoreClient {
  firestore: admin.firestore.Firestore;
  distanceMeasure: "COSINE" | "EUCLIDEAN" | "DOT_PRODUCT";

  constructor(
    firestore: admin.firestore.Firestore,
    distanceMeasure: "COSINE" | "EUCLIDEAN" | "DOT_PRODUCT" = "COSINE"
  ) {
    this.firestore = firestore;
    this.distanceMeasure = distanceMeasure;
  }

  async query(
    query: number[],
    collection: string,
    prefilters: Prefilter[] = [],
    limit: number,
    outputField: string
  ): Promise<
    FirebaseFirestore.VectorQuerySnapshot<
      admin.firestore.DocumentData,
      admin.firestore.DocumentData
    >
  > {
    const col = this.firestore.collection(collection);

    let q: Query | VectorQuery = col;

    // Apply prefilters if provided
    if (prefilters.length > 0) {
      for (const p of prefilters) {
        q = q.where(p.field, p.operator, p.value);
      }
    }

    // Apply vector search
    q = q.findNearest(outputField, query, {
      limit,
      distanceMeasure: this.distanceMeasure,
    });

    // Execute the query and return the result
    try {
      const result = await q.get();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to execute query: ${error.message}`);
      } else {
        throw new Error(
          `Failed to execute query ${JSON.stringify(error, null, 2)}`
        );
      }
    }
  }
}
