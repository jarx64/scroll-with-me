# Scroll With Me

Scroll With Me keeps collapsed editor carets at approximately the same vertical position in the viewport while you scroll. It works with mouse wheels, touchpads, scrollbars, minimaps, built-in scroll commands, split editors, and text diff panes.

The extension complements `editor.cursorSurroundingLines`: that VS Code setting controls the space maintained while navigating with the caret, while Scroll With Me handles viewport-only scrolling.

## Usage

The extension is enabled automatically. Open a text editor, place the caret, and scroll vertically. The caret follows the viewport by the same number of document lines while retaining its preferred character column.

All collapsed carets move when using multiple cursors. If any selection contains text, caret following pauses for that editor so the extension does not change which text is selected.

## Setting

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `scrollWithMe.enabled` | boolean | `true` | Enables caret following for text and diff editors. |

You can configure it globally or for an individual workspace:

```json
{
  "scrollWithMe.enabled": false
}
```

Changes take effect immediately and do not require a window reload.

## Supported editors

Scroll With Me supports editors exposed through VS Code's `TextEditor` API, including normal, read-only, untitled, virtual, split, and text diff editors.

Notebook editors, custom editors, webviews, and terminals use different APIs and are not supported.

## Known limitations

VS Code reports visible document lines, not pixel positions or rendered rows. The extension therefore uses document-line movement. Wrapped lines, folded regions, partial-line scrolling, variable-height decorations, and diff placeholders may not retain the exact visual row.

VS Code also does not identify the source of a viewport change. Carets follow all viewport-only vertical changes, including wheel, touchpad, scrollbar, minimap, and command scrolling. Selection-driven viewport changes are suppressed on a best-effort basis so ordinary caret navigation remains native.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for architecture, maintenance conventions, test commands, and the manual verification matrix. The detailed behavior contract is in [docs/SPECIFICATION.md](docs/SPECIFICATION.md).

## Release notes

See [CHANGELOG.md](CHANGELOG.md).
