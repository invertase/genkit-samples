# Firebase Genkit Sample with Next.js

This sample demonstrates how to deploy a Firebase Genkit flow to an API route of a Next.js app. The project uses React and Tailwind CSS for a basic frontend.

## Trying out the sample

### Prerequisites

This sample uses Vertex AI's Gemini 1.5 Pro Preview model. To run the sample you will need a
Google Cloud Platform project and the Vertex AI API enabled.

Once you have enabled the Vertex AI API on your GCP project, create a service account in the IAM/Admin service, download the private key and set your application default credentials:

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
cd genkit-samples/nextjs && npm i
```

Run locally:

```bash
npm run dev
```

Open http://localhost:3000 with your browser to see the result!

## Genkit Flows: Menu Suggestion

This project includes a Genkit flow that generates menu suggestions for a restaurant based on a user-provided theme. The flow is defined as follows:

```javascript
import { defineFlow, generate } from "genkit";
import { z } from "zod";

export const menuSuggestionFlow = defineFlow(
  {
    name: "menuSuggestionFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const prompt = `Suggest an item for the menu of a ${subject} themed restaurant`;

    const llmResponse = await generate({
      model: geminiPro,
      prompt: prompt,
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text();
  }
);
```

If you have Genkit installed globally you may use `genkit start` to instead open the Genkit UI and experiment with the flow yourself.

## License

This project is licensed under the Apache 2.0 License.
