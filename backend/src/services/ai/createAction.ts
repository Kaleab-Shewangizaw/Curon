import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

const SYSTEM_PROMPT = `your task is to extract and list what the intents are from a user prompt. list them in order. 
intents [
intent1: {
name: "intent name"
tasks: []}]`;
