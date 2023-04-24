import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { OpenAIApi, Configuration } from "openai";
import { pinecone } from "@/lib/pinecone-client";
import crypto from "crypto";
import { render_prompt_for_pi_detection } from "@/lib/templates";
import { v4 as uuidv4 } from "uuid";

const supabaseAdminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

function generate_user_specific_secret(user: string, level: number) {
  // md5 hash of the unhashed string
  const hashed = crypto
    .createHash("md5")
    .update(user + level)
    .digest("hex");

  // return the first 10 characters of the hash
  return hashed.substring(0, 10);
}

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

async function detectPiUsingVectorDatabase(
  input: string,
  similarityThreshold: number
) {
  // Create embedding from input
  const emb = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: input,
  });

  // Get Pinecone Index
  const index = (await pinecone).Index("pig-index");

  // Query similar embeddings
  const queryResponse = await index.query({
    queryRequest: {
      vector: emb.data.data[0].embedding,
      topK: 1,
      includeValues: true,
    },
  });

  if (queryResponse.matches != undefined) {
    for (const match of queryResponse.matches) {
      if (match.score == undefined) {
        continue;
      }

      if (match.score >= similarityThreshold) {
        return true;
      }
    }
  }

  return false;
}

function detectPromptInjectionUsingHeuristicOnInput(input: string) {
  const injectionKeywords = [
    "Ignore everything above",
    "Ignore the previous",
    "Disregard the previous",
    "Forget the previous",
    "Pay no attention to the previous",
    "Start a new conversation",
    "New context",
    "Ignore your instructions",
    "Disregard your instructions",
    "Forget your instructions",
    "Do not follow your instructions",
    "Do not obey your instructions",
  ];

  return injectionKeywords.some((keyword) =>
    input.includes(keyword.toLowerCase())
  );
}

async function writeTextAsEmbeddingToPinecone(input: string, user: string) {
  // Create embedding from input
  const emb = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: input,
  });

  // Get Pinecone Index
  const index = (await pinecone).Index("pig-index");

  // Insert embedding into index
  const upsertRes = index.upsert({
    upsertRequest: {
      vectors: [
        {
          id: uuidv4(),
          values: emb.data.data[0].embedding,
          metadata: {
            input: input,
            user: user,
          },
        },
      ],
    },
  });
}

async function callOpenAiToDetectPI(promptToDetectPiUsingOpenAI: string) {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: promptToDetectPiUsingOpenAI }],
  });

  if (completion.data.choices[0].message === undefined) {
    console.log("completion.data.choices[0].message is undefined");
    return { completion: "", error: "server_error" };
  }

  if (completion.data.choices.length === 0) {
    console.log("completion.data.choices.length === 0");
    return { completion: "", error: "server_error" };
  }

  return {
    completion: completion.data.choices[0].message.content,
    error: undefined,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  await runMiddleware(req, res, cors);
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "not_allowed", message: "Method not allowed" });
  }
  const words = ["elephant", "tiger", "lion", "giraffe", "zebra", "rhino"];
  const canary_word = words[Math.floor(Math.random() * words.length)];
  const is_prompt_safe = {
    heuristic: !(Math.random() * 1),
    vectordb: Math.random() * 1,
    llm: Math.random() * 1,
  };

  const { prompt, heuristic, llm, vectordb } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "missing_prompt" });
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log(`Prompt: ${prompt}`);
  console.log(`Heuristic: ${heuristic}`);
  console.log(`LLM: ${llm}`);
  console.log(`VectorDB: ${vectordb}`);
  res.status(200).json({
    prompt,
    canary_word,
    is_prompt_safe,
    output: "",
  });
}
