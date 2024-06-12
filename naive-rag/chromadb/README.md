# Genkit Chroma Indexer and Retriever Sample

This project demonstrates the integration of Firebase Genkit with Chroma to index and retrieve film descriptions using text embeddings. The flows defined in this sample are designed to process text data, generate embeddings using the Vertex AI Text Embedding Gecko model, and store the embeddings in a dockerized Chroma collection for efficient retrieval.

## Defined Flows

### filmIndexerFlow

This flow indexes a list of film descriptions, generating embeddings and storing them in the Chroma collecton

#### Input Schema:

No input required. The flow uses predefined fake data.

#### Output Schema:

No output. The flow processes and stores data directly in the database.

### filmRetrieverFlow

This flow retrieves film descriptions from the Chroma database based on a query, using text embeddings to find the most similar films.

#### Input Schema

```typescript
const inputSchema = z.object({
  query: z.string(),
  topK: z.number().optional(),
});
```

#### Output Schema

```typescript
const outputSchema = z.array(z.string());
```

## Prerequisites

Google Cloud Service Account:

1. Create a Google Cloud Service Account with the following role:

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
cd genkit-samples/naive-rag/chromadb
npm install
```

6. Start the PostgreSQL server:

For this you will have to have Docker working on your machine.

```sh
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

6. Start Genkit:

```sh
genkit start
```

This command will start the Genkit server and make the defined flows available for execution.

You can now interact with the flows using the Genkit interface or by making API requests to the endpoints provided by Genkit.
