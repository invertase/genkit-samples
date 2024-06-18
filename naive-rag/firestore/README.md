# Genkit Film Embedding and Retrieval with Firestore

## Overview

This Firebase Genkit with Firestore to index and retrieve film descriptions using text embeddings. The flows defined in this sample are designed to process text data, generate embeddings using the Vertex AI Gecko model, and store the embeddings in a Firestore database for efficient retrieval.

## Defined Flows

### filmIndexerFlow

This flow indexes a list of film descriptions, generating embeddings using Vertex AI and storing them in a Firestore database.

#### Input Schema:

No input required. The flow uses predefined fake data.

#### Output Schema:

No output. The flow processes and stores data directly in the Firestore database.

### filmRetrieverFlow

This flow retrieves film descriptions from the Firestore database based on a query, using text embeddings to find the most similar films.

#### Input Schema:

```typescript
const inputSchema = z.object({
  query: z.string(),
  k: z.number().default(3),
});
```

#### Output Schema:

```typescript
const outputSchema = z.array(z.string());
```

## Running the Sample

Follow these steps to set up and run the sample:

### Prerequisites

#### Google Cloud Service Account:

1. Create a Google Cloud Service Account with the necessary permissions:

- Firestore Index Creator
- Firestore Read and Write
- Vertex AI User

2. Download the service account JSON key file.

3. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of your service account key file:

4. Add `PROJECT_ID-<Your firebase project ID>` to a `.env` file at the root of the sample.

### Create the index

After the first query you should get an error and be prompted to create an index. You can do so by running the following command, substituting your project ID where appropriate.

```sh
gcloud alpha firestore indexes composite create --project=<Your firebase project ID> --collection-group=films --query-scope=COLLECTION --field-config=vector-config='{"dimension":"768","flat": "{}"}',field-path=embedding
```
