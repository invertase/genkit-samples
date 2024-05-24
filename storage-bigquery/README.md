# Genkit Firebase Storage and BigQuery Sample

## Overview

This project demonstrates the integration of Firebase Genkit with Firebase Storage and Google Cloud BigQuery to describe images and store the generated descriptions in BigQuery tables. The flows defined in this sample are designed to process images, generate descriptions using the Vertex AI Gemini Pro Vision model, and store the results in a BigQuery table.

## Defined Flows

### imageDescriptionFlow

This flow generates a description for a given image stored in a Google Cloud Storage bucket. It validates that the provided file is an image and uses the Vertex AI Gemini Pro Vision model to generate a textual description of the image.

#### Input Schema:

```typescript
const inputSchema = z.object({
  bucketName: z.string(),
  filePath: z.string(),
});
```

#### Output Schema:

```typescript
const outputSchema = z.object({
  description: z.string(),
});
```

### writeToBigQueryFlow

This flow writes the generated image description along with metadata to a specified BigQuery table.

#### Input Schema:

```typescript
const inputSchema = z.object({
  description: z.string(),
  bucketName: z.string(),
  filePath: z.string(),
  datasetId: z.string(),
  tableName: z.string(),
});
```

#### Output Schema:

```typescript
const outputSchema = z.string();
```

### createDatasetAndTableFlow

This flow ensures that the specified BigQuery dataset and table exist. If they don't, it creates them.

#### Input Schema:

```typescript
const datasetTableSchema = z.object({
  datasetId: z.string(),
  tableName: z.string(),
});
```

#### Output Schema:

```typescript
const outputSchema = z.string();
```

### totalFlow

This flow combines imageDescriptionFlow and writeToBigQueryFlow to create a flow that describes an image and stores the description in a BigQuery table.

#### Input Schema:

```typescript
const inputSchema = z.object({
  bucketName: z.string(),
  filePath: z.string(),
  datasetId: z.string(),
  tableName: z.string(),
});
```

#### Output Schema:

```typescript
const outputSchema = z.string();
```

## Running the Sample

Follow these steps to set up and run the sample project:

### Prerequisites

Google Cloud Service Account:

1. Create a Google Cloud Service Account with the following permissions:

   - Storage Object Viewer
   - BigQuery Data Editor

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
cd genkit-samples/storage-bigquery
npm install
```

6. Start Genkit:

```sh
genkit start
```

This command will start the Genkit server and make the defined flows available for execution.

You can now interact with the flows using the Genkit interface or by making API requests to the endpoints provided by Genkit.

For instance, you can trigger the totalFlow to process an image and store its description in BigQuery.
