# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

## Neon Database

  **Project:** `old-tooth-67280089` (devstash)

  **Branch Policy:**
  - **ALWAYS use the `development` branch** (`br-spring-art-ag1e2x14`) for all database
   operations
  - **NEVER touch the `production` branch** unless explicitly requested by the user    
  - When using Neon MCP tools, always include `branchId: "br-spring-art-ag1e2x14"`     
  parameter

  **Defaults for Neon MCP calls:**
  - `projectId`: `old-tooth-67280089`
  - `branchId`: `br-spring-art-ag1e2x14`

  This ensures any Neon MCP tool calls will default to the development branch and avoid accidental production data modifications.
