# AI Integration Research

## Output

docs/ai-integration-plan.md

## Research

Investigate best practices for integrating the Groq models into a Next.js application for the following features:

- Auto-tagging content
- AI-generated summaries
- Code explanation
- Prompt optimization

## Models

Confirm these choices based on production/preview models available on Groq:

| Feature              | Model Choice            | Reasoning (The "Why")                                                                                                                                                            |
| :------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-Tagging**     | Llama 4 Scout (17B-16E) | **Strict Structured Outputs.** Groq’s documentation explicitly favors Scout for 100% schema adherence. At **~750 TPS**, it’s the king of fast, reliable JSON metadata.           |
| **Summarization**    | GPT-OSS-120B            | **Nuance > Speed.** Summarizing long technical docs or messy threads requires the "OpenAI-style" reasoning found in the 120B. It captures intent that smaller models often skip. |
| **Code Explanation** | Qwen 3 32B              | **The Coder’s Choice.** Qwen 3 consistently outperforms generalist models on logic-heavy code. It understands the _why_ behind a function, not just the what.                    |
| **Prompt Tuning**    | GPT-OSS-120B            | **Meta-Reasoning.** Optimizing a prompt is an "Agentic" task. With a **SWE-Bench Verified score of 62.4**, this is your best bet for high-level creative engineering.            |

## Include

- Fetch calls and configuration (openai endpoint format: https://api.groq.com/openai/v1/chat/completions)
- Server action patterns for AI calls
- Streaming vs non-streaming responses
- Error handling and rate limiting
- Pro user gating patterns
- Cost optimization strategies
- UI patterns for AI features (loading states, accept/reject suggestions)
- Security considerations (API key handling, input sanitization)

## Sources

- Web search for Groq + Next.js patterns
- Context7 docs for Groq (openai endpoint format)
- Existing codebase patterns (server actions, Pro gating)
- @src/actions/\*.ts for action patterns
- @src/lib/usage-limits.ts for gating patterns
