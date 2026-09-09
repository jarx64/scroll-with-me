# Scroll With Me v1 Specification

## Purpose

Keep collapsed carets at approximately the same vertical viewport offset when a VS Code text editor is scrolled independently of caret navigation.

## Behavior contract

1. Record the first visible document line for every visible text editor.
2. When that line changes without a pending selection navigation, translate every collapsed caret by the same signed line delta.
3. Preserve each caret's preferred character position. Clamp it to the destination line length when necessary and restore it on a later, longer line.
4. Clamp target lines to the document's first and last lines.
5. Do not alter non-empty selections. If any selection is expanded, rebaseline the viewport and wait until all selections are collapsed.
6. Treat each VS Code `TextEditor` independently. This includes the original and modified editors exposed for a text diff.
7. Rebaseline without moving carets when the extension is enabled or disabled, an editor becomes visible, or no previous viewport position exists.
8. Never edit document text, reveal a range, change focus, or add an undo entry.

## Configuration contract

`scrollWithMe.enabled` is a resource-scoped boolean setting with a default of `true`. It can be set at user, workspace, or workspace-folder scope. Configuration changes take effect immediately.

## Supported contexts

- Editable and read-only text editors
- Untitled and virtual text documents
- Split editor groups
- Both panes of text diff editors

Notebook editors, notebook output, custom editors, webviews, terminals, and views not exposed as `TextEditor` are outside v1.

## Platform limitations

The stable VS Code API emits visible-range changes without an input-source reason. The implementation therefore reacts to all viewport-only vertical changes rather than attempting to distinguish wheel, touchpad, scrollbar, minimap, and command input.

Visible ranges use document lines and do not expose scroll pixels or rendered visual rows. Exact positioning is consequently not guaranteed around wrapped lines, folds, partial lines, variable-height decorations, or diff placeholders. Horizontal scrolling is outside the behavior contract.

## Acceptance scenarios

- Scrolling from top line 10 to top line 15 moves a caret from line 20 to line 25.
- Scrolling upward produces the equivalent negative line translation.
- Moving through a short line clamps the character position; continuing to a longer line restores the stored preferred character.
- Multiple collapsed carets move by the same line delta.
- Any non-empty selection prevents all caret translation in that editor.
- Translation stops safely at the first and last document lines.
- Each split editor and diff pane maintains independent viewport and caret state.
- Keyboard, mouse, and command selection navigation does not receive a second movement from the extension.
- Disabling or re-enabling the setting does not cause an initial caret jump.
