"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

const queryClient = new QueryClient();

const fetchSuggestion = async (subject: string) => {
  const response = await fetch(`/api/flow?subject=${subject}`);
  if (!response.ok) {
    throw new Error("Failed to fetch suggestion");
  }
  const data = await response.json();
  return data.message;
};

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <MenuSuggestion />
    </QueryClientProvider>
  );
}

function MenuSuggestion() {
  const [subject, setSubject] = useState("");
  const [enabled, setEnabled] = useState(false);

  const {
    data: suggestion,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["subject", subject],
    queryFn: () => fetchSuggestion(subject),
    enabled,
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubject(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnabled(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Menu Suggestion</h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="text"
            value={subject}
            onChange={handleInputChange}
            placeholder="Enter a theme (e.g., Italian)"
            className="mb-4 px-4 py-2 border border-gray-300 rounded-md w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Get Menu Suggestion
          </button>
        </form>
        {isLoading && <p className="mt-4 text-blue-500">Loading...</p>}
        {error && <p className="mt-4 text-red-500">{error.message}</p>}
        {suggestion && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50">
            <h3 className="text-2xl font-semibold mb-4 text-blue-600">
              Suggested Menu Item:
            </h3>
            <ReactMarkdown className="prose prose-lg">
              {suggestion}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </main>
  );
}
