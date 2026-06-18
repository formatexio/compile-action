# FormaTeX Compile Action

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-FormaTeX%20Compile-blue?logo=github)](https://github.com/marketplace/actions/formatex-compile)
[![Latest Release](https://img.shields.io/github/v/release/formatexio/compile-action)](https://github.com/formatexio/compile-action/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Compile LaTeX documents to PDF in your CI pipeline using the [FormaTeX](https://formatex.io) API. Supports `pdflatex`, `xelatex`, `lualatex`, and `latexmk`. No TeX Live installation required on your runner.

---

## Quick start

```yaml
- uses: formatexio/compile-action@v1
  with:
    api-key: ${{ secrets.FORMATEX_API_KEY }}
```

Add your FormaTeX API key as a repository secret named `FORMATEX_API_KEY`. You can create one at [app.formatex.io](https://app.formatex.io) under **Settings → API Keys**.

---

## Full example

```yaml
name: Compile LaTeX

on:
  push:
    branches: [main]
    paths: ['**.tex', '**.bib']
  pull_request:
    paths: ['**.tex', '**.bib']
  workflow_dispatch:

jobs:
  compile:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Compile LaTeX
        id: compile
        uses: formatexio/compile-action@v1
        with:
          api-key: ${{ secrets.FORMATEX_API_KEY }}
          file: main.tex
          engine: pdflatex
          output: build/document.pdf

      - name: Upload PDF
        uses: actions/upload-artifact@v4
        with:
          name: compiled-pdf
          path: ${{ steps.compile.outputs.pdf-path }}
          retention-days: 30
```

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | Yes | — | FormaTeX API key. Always use a [GitHub secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets). |
| `file` | No | `main.tex` | Path to the main `.tex` file, relative to the repository root. |
| `engine` | No | `pdflatex` | LaTeX engine: `pdflatex`, `xelatex`, `lualatex`, or `latexmk`. |
| `output` | No | `output.pdf` | Output PDF file path. Parent directories are created automatically. |
| `runs` | No | — | Number of compilation passes (1–5). Defaults to the API's automatic setting. |
| `timeout` | No | — | Compilation timeout in seconds. Defaults to the API's plan limit. |

## Outputs

| Output | Description |
|--------|-------------|
| `pdf-path` | Path to the compiled PDF file, as passed to `output`. |

---

## More examples

### XeLaTeX for Unicode / system fonts

```yaml
- uses: formatexio/compile-action@v1
  with:
    api-key: ${{ secrets.FORMATEX_API_KEY }}
    file: thesis/main.tex
    engine: xelatex
    output: thesis/thesis.pdf
```

### Multiple compilations for cross-references

```yaml
- uses: formatexio/compile-action@v1
  with:
    api-key: ${{ secrets.FORMATEX_API_KEY }}
    engine: pdflatex
    runs: 3
    output: paper.pdf
```

### Use the compiled PDF in a later step

```yaml
- name: Compile
  id: latex
  uses: formatexio/compile-action@v1
  with:
    api-key: ${{ secrets.FORMATEX_API_KEY }}

- name: Attach PDF to release
  uses: softprops/action-gh-release@v2
  with:
    files: ${{ steps.latex.outputs.pdf-path }}
```

### Compile on every PR and post a comment with the download link

```yaml
- name: Compile
  id: latex
  uses: formatexio/compile-action@v1
  with:
    api-key: ${{ secrets.FORMATEX_API_KEY }}
    output: build/preview.pdf

- uses: actions/upload-artifact@v4
  id: upload
  with:
    name: preview-pdf
    path: ${{ steps.latex.outputs.pdf-path }}

- uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `PDF compiled — [download artifact](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`
      })
```

---

## Error output

When compilation fails, the action prints the full LaTeX log and any suggestions from the FormaTeX API to the workflow console, then exits with a non-zero status.

```
::error::Compilation failed: Undefined control sequence \foo on line 12.

─── Compilation log ────────────────────────────────────
! Undefined control sequence.
l.12 \foo
...
────────────────────────────────────────────────────────

Suggestions:
  • Did you mean \footnote?
  • Add \usepackage{...} for the package that defines \foo
```

---

## Requirements

- A [FormaTeX](https://formatex.io) account with an API key.
- Any GitHub-hosted runner (`ubuntu-latest`, `macos-latest`, `windows-latest`). No TeX Live installation needed.

## Links

- [FormaTeX website](https://formatex.io)
- [API documentation](https://docs.formatex.io)
- [Create an API key](https://app.formatex.io)
- [Report an issue](https://github.com/formatexio/compile-action/issues)

## License

[MIT](LICENSE)
