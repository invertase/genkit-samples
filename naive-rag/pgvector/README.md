# Genkit PgVector Indexer and Retriever Sample

This project demonstrates the integration of Firebase Genkit with PostgreSQL to index and retrieve film descriptions using text embeddings. The flows defined in this sample are designed to process text data, generate embeddings using the Vertex AI Text Embedding Gecko model, and store the embeddings in a PostgreSQL database for efficient retrieval.

## Defined Flows

### filmIndexerFlow

This flow indexes a list of film descriptions, generating embeddings and storing them in a PostgreSQL database.

#### Input Schema:

No input required. The flow uses predefined fake data.

#### Output Schema:

No output. The flow processes and stores data directly in the database.

### filmRetrieverFlow

This flow retrieves film descriptions from the PostgreSQL database based on a query, using text embeddings to find the most similar films.

#### Input Schema

```typescript
const inputSchema = z.object({
  query: z.string(),
  topK: z.number().optional(),
});
```

#### Output Schema

```typescript
const outputSchema = z.array(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    distance: z.number().optional(),
  })
);
```

## Prerequisites

Google Cloud Service Account:

1. Create a Google Cloud Service Account with the following permissions:

   - Vertex AI User 

2. Download the service account JSON key file.

3. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your service account key file:

```sh
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-file.json
```

4. Install Genkit CLI:

```sh
npm install -g genkit
```

5. Clone the repository (or download the sample code) and run `npm install`:

```sh
git clone git@github.com:invertase/genkit-samples.git
cd genkit-samples/naive-rag/pgvector
npm install
```

6. Start the PostgreSQL server:

For this you will have to have Docker and Docker Compose working on your machine.

Run the following from this directory:

```sh
docker-compose up -d
```

6. Start Genkit:

```sh
genkit start
```

This command will start the Genkit server and make the defined flows available for execution.

You can now interact with the flows using the Genkit interface or by making API requests to the endpoints provided by Genkit.
