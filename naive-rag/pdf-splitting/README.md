# Simple PDF Chunking with Chroma Indexer and Retriever Sample

This project demonstrates the integration of Genkit with Chroma to chunk and index a PDF file, and provide a flow to retrieve information using text embeddings. The flows defined in this sample are designed to process text data, generate embeddings using the Vertex AI Text Embedding Gecko model, and store the embeddings in a Dockerized Chroma collection for efficient retrieval.

## Defined Flows

### extractTextFlow

This flow extracts text from a PDF file.

#### Input Schema:

The input is a path to a file on your local machine.

```typescript
const inputSchema = z.object({ filePath: z.string() });
```

#### Output Schema:

The output will be the extracted PDF text.

```typescript
const outputSchema = z.object({ text: z.string() });
```

### chunkTextFlow

This flow chunks the extracted text into smaller pieces for indexing.

#### Input Schema:

```typescript
const inputSchema = z.object({
  text: z.string(),
  chunkLength: z.number().default(200),
  overlapLength: z.number().default(0),
});
```

#### Output Schema:

```typescript
const outputSchema = z.array(
  z.object({
    text: z.string(),
    chunkIndex: z.number(),
  })
);
```

### indexerFlow

This flow indexes the chunked text into the Chroma collection.

#### Input Schema:

```typescript
const inputSchema = z.array(
  z.object({
    text: z.string(),
    chunkIndex: z.number(),
  })
);
```

#### Output Schema:

```typescript
const outputSchema = z.string();
```

### totalFlow

This flow orchestrates the extraction, chunking, and indexing of the PDF text.

#### Input Schema:

```typescript
const inputSchema = z.object({
  filePath: z.string(),
  chunkLength: z.number().optional(),
  overlapLength: z.number().optional(),
});
```

The chunkLength and overlapLength parameters are available and determine how the text is divided into smaller, manageable pieces (chunks) for indexing and retrieval.

##### chunkLength

This parameter specifies the length of each chunk of text in terms of the number of characters. For instance, if chunkLength is set to 200, the text will be divided into chunks of 200 characters each. This helps in breaking down large documents into smaller segments that can be more easily indexed and retrieved. The choice of chunk length can impact the efficiency and performance of the retrieval process; shorter chunks may result in more precise matches but require more storage and processing, while longer chunks may reduce storage needs but potentially dilute the specificity of the retrieval.

##### overlapLength

This parameter determines the number of characters that overlap between consecutive chunks. Overlapping is used to ensure that important information that might be cut off at the boundary of a chunk is still captured in the adjacent chunk. For example, if overlapLength is set to 50, each chunk will overlap the next chunk by 50 characters. This helps in preserving the context and continuity of the text across chunks, improving the accuracy of information retrieval by ensuring that queries can match context that spans chunk boundaries.

Together, these parameters allow for flexible and efficient chunking of text, balancing the needs for detailed context preservation and efficient processing.

#### Output Schema:

```typescript
const outputSchema = z.string();
```

### retrieverFlow

This flow retrieves indexed text chunks based on a query.

#### Input Schema:

```typescript
const inputSchema = z.object({
  query: z.string(),
  k: z.number().optional(),
});
```

#### Output Schema:

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

6. Start the Chroma server:

For this, you will need Docker installed and running on your machine.

```sh
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

7. Start Genkit:

```sh
genkit start
```

This command will start the Genkit server and make the defined flows available for execution.

You can now interact with the flows using the Genkit interface or by making API requests to the endpoints provided by Genkit.
