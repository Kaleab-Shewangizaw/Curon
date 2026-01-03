"use client";

import { useState } from "react";

export default function Home() {
  const [AiResponse, setAiResponse] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const processPrompt = async () => {
    setLoading(true);
    const response = await fetch("http://localhost:5000/getPrompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    setAiResponse(data);
    setLoading(false);
  };

  const stopProcessing = () => {
    //stop fetching

    setLoading(false);
  };

  return (
    <main>
      <h1>Welcome to the Home Page</h1>

      {AiResponse && <pre>{JSON.stringify(AiResponse, null, 2)}</pre>}

      <input
        type="text"
        value={prompt}
        placeholder="Enter your prompt here"
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button onClick={processPrompt}>Process Prompt</button>

      <button onClick={() => setAiResponse(null)}>Clear Response</button>
      <button onClick={stopProcessing}>Stop</button>

      {loading && <p>Loading...</p>}
    </main>
  );
}
