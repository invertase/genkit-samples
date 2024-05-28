# Daily HF Papers Summary with Genkit

This samples demonstrates how to use Genkit to generate a daily summary of papers from the [daily Hugging Face papers](https://huggingface.co/papers) API.

## Trying out the sample

### Prerequisites

This sample uses Vertex AI's Gemini 1.5 Pro Preview model. To run the sample you will need a
Google Cloud Platform project and the Vertex AI API enabled.

Once you have enabled the Vertex AI API on your GCP project, create a service account in the IAM/Admin service, 
download the private key and set your application default credentials:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=path/to/your/json
```

### Running the sample locally

Clone the repo:

```bash
git clone git@github.com:invertase/genkit-samples.git
```

Install dependencies:

```bash
cd genkit-samples/hf-daily-papers-summary && npm i
```

Run locally:

```bash
npm run start
```

Open http://localhost:4000 with your browser to see the result!