# Item Types

DevStash uses 7 core item types to organize developer resources. Each type defines how an item is stored, displayed, and interacted with.

## System Item Types

| Type | Icon | Color (Hex) | Content Type | Purpose | Key Fields |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Snippet** | `Code` | `#3b82f6` | `TEXT` | Reusable code blocks, hooks, and patterns. | `content`, `language` |
| **Prompt** | `Sparkles` | `#8b5cf6` | `TEXT` | AI prompts, system messages, and workflow instructions. | `content` |
| **Command** | `Terminal` | `#f97316` | `TEXT` | Shell commands, scripts, and CLI snippets. | `content` |
| **Note** | `StickyNote` | `#fde047` | `TEXT` | General documentation, explanations, and ideas. | `content` |
| **File** | `File` | `#6b7280` | `FILE` | Documents, configuration files, and assets. | `fileUrl`, `fileName`, `fileSize` |
| **Image** | `Image` | `#ec4899` | `FILE` | Screenshots, UI references, and visual designs. | `fileUrl`, `fileName`, `fileSize` |
| **Link** | `Link` | `#10b981` | `URL` | Documentation links, bookmarks, and web resources. | `url` |

---

## Content Classification

Items are classified into three primary content categories:

### 1. Text Classification (`TEXT`)
- **Types:** Snippet, Prompt, Command, Note.
- **Storage:** Content is stored directly in the database `content` field (up to 64KB/Text limit).
- **Behavior:** Editable via a Markdown editor; Snippets support syntax highlighting via the `language` field.

### 2. File Classification (`FILE`)
- **Types:** File, Image.
- **Storage:** Binary data is stored in Cloudflare R2; the database stores `fileUrl`, `fileName`, and `fileSize`.
- **Behavior:** (Pro Feature) Supports uploads/downloads; Images are rendered as visual previews.

### 3. URL Classification (`URL`)
- **Types:** Link.
- **Storage:** The database stores the destination `url`.
- **Behavior:** Opens in a new tab; intended for external references and documentation.

---

## Shared Properties

All items, regardless of type, share the following core metadata:

- **Identity:** `id`, `title`, `description`.
- **Organization:** `userId`, `itemTypeId`, `tags`, `collections`.
- **Status:** `isFavorite`, `isPinned`.
- **Timestamps:** `createdAt`, `updatedAt`.

## Display Differences

- **Snippets:** Integrated syntax highlighting in the viewer.
- **Files/Images:** Priority on downloadability and visual previewing.
- **Prompts/Commands:** Optimized for "Copy to Clipboard" actions.
- **Links:** Direct navigation to external resources.
