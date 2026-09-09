# Development Reference

## Architecture

The extension has three layers:

- `extension.ts` is the composition root and owns the controller through the extension subscription lifecycle.
- `editorScrollController.ts` connects VS Code events to per-editor state, configuration, selection translation, and cleanup.
- `scrollPolicy.ts` contains deterministic policy and caret-translation functions without a VS Code dependency.

Configuration identifiers and typed access are centralized in `configuration.ts`.

## Event flow

For each visible `TextEditor`, the controller stores its first visible line, preferred character for each caret, and selection-navigation state.

On a visible-range event, the controller evaluates the new first visible line against the prior value. An enabled editor with only collapsed selections and no pending navigation translates its carets by the line delta. Every other case updates the baseline without moving a caret.

Assigning `TextEditor.selections` causes a selection event. The expected selection is recorded before assignment so that event is recognized as internal and does not overwrite preferred character positions. External selection events temporarily mark navigation as pending and rebaseline after VS Code finishes the event turn. This prevents a cursor reveal from being mistaken for independent scrolling.

The map is pruned whenever visible editors change. All timers and VS Code subscriptions are disposed with the controller.

## Type and identifier conventions

- Keep extension/configuration IDs in `configuration.ts`; do not repeat string literals at call sites.
- Represent finite policy outcomes with enums and structured interfaces.
- Keep deterministic calculations in `scrollPolicy.ts` so they remain straightforward to unit test.
- Keep editor identity keyed by the `TextEditor` object. A URI is insufficient because the same document can appear in multiple groups or diff tabs.
- Do not depend on undocumented VS Code commands or Monaco internals.

## Local development

Install dependencies and validate the project:

```sh
pnpm install
pnpm run check-types
pnpm run lint
pnpm run compile
pnpm test
```

Use `pnpm run watch` during development. Press `F5` in VS Code to launch the Extension Development Host defined by the generated workspace configuration.

`pnpm run package` performs a production bundle. The resulting extension entry point is `dist/extension.js`.

## Automated test strategy

Policy tests cover signed viewport deltas, suppression conditions, preferred-character behavior, and document-boundary clamping. Extension-host tests verify contributed configuration and activation lifecycle wiring.

When modifying event sequencing, add focused tests to `scrollPolicy.test.ts` and perform the manual event tests below because VS Code does not expose a public API for synthesizing native wheel gestures.

## Manual verification matrix

Use a file long enough to scroll with `editor.cursorSurroundingLines` set to a non-zero value.

1. Put a caret near the viewport center and scroll up/down with a mouse wheel and touchpad. Its document line should change while its viewport row stays approximately fixed.
2. Repeat with the scrollbar, minimap, and built-in scroll-line/page commands.
3. Move the caret with arrow keys, Page Up/Down, mouse clicks, Go to Line, and symbol navigation. Verify there is no extra caret movement.
4. Add multiple collapsed carets and repeat scrolling. Verify all carets translate together.
5. Select text and scroll. Verify the selection remains unchanged. Collapse the selection and verify following resumes from the current viewport.
6. Scroll through short lines and confirm the preferred character position returns on a later long line.
7. Test near the first and last document lines.
8. Open two editor groups and verify their caret/viewport state is independent.
9. Open a text diff, focus and scroll each side, and test both synchronized and unsynchronized diff scrolling.
10. Toggle `scrollWithMe.enabled` at user and workspace scope and verify the change is immediate and jump-free.
11. Exercise wrapped lines, folds, code lenses, and inline diff content to confirm the documented best-effort behavior is acceptable.

## Future extension points

- Notebook support requires the separate `NotebookEditor` APIs and a cell-aware behavior contract.
- Exact visual-row tracking would require a future stable VS Code API that exposes rendered rows or pixel scroll offsets.
- Input-specific behavior would require a future viewport event reason or supported wheel-input hook.
