# codaio

A CLI for the [Coda API v1](https://coda.io/developers/apis/v1), designed for use by AI agents (Claude Code, Cursor, etc.) and humans alike.

## Installation

```bash
npm install -g codaio
# or
bunx codaio
```

## Authentication

Generate an API token at https://coda.io/account, then:

```bash
codaio login
```

Or set the `CODA_API_TOKEN` environment variable (takes priority over stored token).

## Usage

```
codaio [options] [command]

Options:
  --format <format>  Output format: json (default) or table

Commands:
  login              Authenticate with an API token
  logout             Remove stored token
  whoami             Show current user

  docs list          List docs
  docs get           Get a doc by ID
  docs create        Create a new doc
  docs delete        Delete a doc

  tables list        List tables in a doc
  tables get         Get a table by ID or name

  columns list       List columns in a table

  rows list          List rows in a table
  rows get           Get a row by ID or name
  rows upsert        Insert or upsert rows
  rows update        Update a row
  rows delete        Delete rows

  pages list         List pages in a doc
  pages get          Get a page by ID or name
  pages update       Update a page's metadata
  pages export       Export a page to HTML or Markdown

  formulas list      List formulas in a doc
  formulas get       Get a formula by ID or name

  controls list      List controls in a doc
  controls get       Get a control by ID or name
```

## Output Formats

By default all commands output JSON — ideal for piping to `jq` or agent use.

```bash
codaio docs list | jq '.[].name'

# Human-readable table
codaio docs list --format table
```

## Examples

```bash
# List all docs you own
codaio docs list --is-owner

# Get all rows from a table
codaio rows list <docId> <tableId> --all

# Upsert a row (by column name key)
codaio rows upsert <docId> <tableId> \
  --cells '[{"column":"Name","value":"Alice"}]' \
  --key-columns Name

# Export a page to Markdown
codaio pages export <docId> <pageId> --output-format markdown
```

## Environment Variables

| Variable         | Description                             |
| ---------------- | --------------------------------------- |
| `CODA_API_TOKEN` | Coda API token (overrides stored token) |

## TODO: Future API coverage

- [ ] Permissions (ACL/sharing)
- [ ] Publishing
- [ ] Packs
- [ ] Analytics
- [ ] Automations
- [ ] Folders
- [ ] Workspaces
- [ ] Miscellaneous (resolveBrowserLink, mutationStatus, categories)

## Development

```bash
bun install
bun run src/index.ts --help   # dev
bun test                       # run tests
bun run build                  # build to dist/cli.js
bun run generate:types         # regenerate OpenAPI types
```

## Releasing

Create a changeset for any user-facing change:

```bash
bun run changeset
```

When you're ready to publish, run the `Release` workflow in GitHub Actions from the branch you want to release. The workflow will:

- build the CLI
- version the package with Changesets
- update `CHANGELOG.md`
- publish to npm
- push the release commit and tag back to GitHub

The workflow requires a repository secret named `NPM_TOKEN`.
