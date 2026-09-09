import * as vscode from 'vscode';
import { enabledConfigurationId, isEnabledFor } from './configuration';
import { evaluateScroll, ScrollAction, translateCaret } from './scrollPolicy';

interface EditorState {
	navigationPending: boolean;
	navigationTimer: NodeJS.Timeout | undefined;
	pendingAppliedSelections: readonly vscode.Selection[] | undefined;
	preferredCharacters: number[];
	viewportAnchorLine: number | undefined;
}

export class EditorScrollController implements vscode.Disposable {
	private readonly disposables: vscode.Disposable[] = [];
	private readonly states = new Map<vscode.TextEditor, EditorState>();

	public constructor() {
		this.disposables.push(
			vscode.window.onDidChangeTextEditorVisibleRanges(event => this.handleVisibleRangesChange(event)),
			vscode.window.onDidChangeTextEditorSelection(event => this.handleSelectionChange(event)),
			vscode.window.onDidChangeVisibleTextEditors(editors => this.handleVisibleEditorsChange(editors)),
			vscode.workspace.onDidChangeConfiguration(event => this.handleConfigurationChange(event)),
		);

		this.handleVisibleEditorsChange(vscode.window.visibleTextEditors);
	}

	public dispose(): void {
		for (const state of this.states.values()) {
			this.clearNavigationTimer(state);
		}
		this.states.clear();

		for (const disposable of this.disposables) {
			disposable.dispose();
		}
	}

	private handleVisibleRangesChange(event: vscode.TextEditorVisibleRangesChangeEvent): void {
		const currentAnchorLine = getViewportAnchorLine(event.visibleRanges);
		const state = this.getOrCreateState(event.textEditor);

		if (currentAnchorLine === undefined) {
			state.viewportAnchorLine = undefined;
			return;
		}

		const selections = event.textEditor.selections;
		this.ensurePreferredCharacters(state, selections);

		const evaluation = evaluateScroll({
			currentAnchorLine,
			enabled: isEnabledFor(event.textEditor),
			hasExpandedSelection: selections.some(selection => !selection.isEmpty),
			navigationPending: state.navigationPending,
			previousAnchorLine: state.viewportAnchorLine,
		});

		state.viewportAnchorLine = currentAnchorLine;
		if (evaluation.action !== ScrollAction.TranslateCarets) {
			return;
		}

		const translatedSelections = selections.map((selection, index) => {
			const translated = translateCaret({
				caret: selection.active,
				lineDelta: evaluation.lineDelta,
				lineLengthAt: line => event.textEditor.document.lineAt(line).text.length,
				lineCount: event.textEditor.document.lineCount,
				preferredCharacter: state.preferredCharacters[index] ?? selection.active.character,
			});
			const position = new vscode.Position(translated.line, translated.character);
			return new vscode.Selection(position, position);
		});

		if (selectionsEqual(selections, translatedSelections)) {
			return;
		}

		state.pendingAppliedSelections = translatedSelections;
		event.textEditor.selections = translatedSelections;
	}

	private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
		const state = this.getOrCreateState(event.textEditor);
		if (
			event.kind === undefined &&
			state.pendingAppliedSelections !== undefined &&
			selectionsEqual(event.selections, state.pendingAppliedSelections)
		) {
			state.pendingAppliedSelections = undefined;
			return;
		}

		state.pendingAppliedSelections = undefined;
		state.preferredCharacters = event.selections.map(selection => selection.active.character);
		state.navigationPending = true;
		this.clearNavigationTimer(state);
		state.navigationTimer = setTimeout(() => {
			if (this.states.get(event.textEditor) !== state) {
				return;
			}
			state.viewportAnchorLine = getViewportAnchorLine(event.textEditor.visibleRanges);
			state.navigationPending = false;
			state.navigationTimer = undefined;
		}, 0);
	}

	private handleVisibleEditorsChange(editors: readonly vscode.TextEditor[]): void {
		const visibleEditors = new Set(editors);
		for (const [editor, state] of this.states) {
			if (!visibleEditors.has(editor)) {
				this.clearNavigationTimer(state);
				this.states.delete(editor);
			}
		}

		for (const editor of editors) {
			this.getOrCreateState(editor);
		}
	}

	private handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
		for (const [editor, state] of this.states) {
			if (event.affectsConfiguration(enabledConfigurationId, editor.document.uri)) {
				this.rebaseline(editor, state);
			}
		}
	}

	private getOrCreateState(editor: vscode.TextEditor): EditorState {
		const existing = this.states.get(editor);
		if (existing !== undefined) {
			return existing;
		}

		const state: EditorState = {
			navigationPending: false,
			navigationTimer: undefined,
			pendingAppliedSelections: undefined,
			preferredCharacters: editor.selections.map(selection => selection.active.character),
			viewportAnchorLine: getViewportAnchorLine(editor.visibleRanges),
		};
		this.states.set(editor, state);
		return state;
	}

	private ensurePreferredCharacters(
		state: EditorState,
		selections: readonly vscode.Selection[],
	): void {
		if (state.preferredCharacters.length !== selections.length) {
			state.preferredCharacters = selections.map(selection => selection.active.character);
		}
	}

	private rebaseline(editor: vscode.TextEditor, state: EditorState): void {
		this.clearNavigationTimer(state);
		state.navigationPending = false;
		state.pendingAppliedSelections = undefined;
		state.preferredCharacters = editor.selections.map(selection => selection.active.character);
		state.viewportAnchorLine = getViewportAnchorLine(editor.visibleRanges);
	}

	private clearNavigationTimer(state: EditorState): void {
		if (state.navigationTimer !== undefined) {
			clearTimeout(state.navigationTimer);
			state.navigationTimer = undefined;
		}
	}
}

function getViewportAnchorLine(ranges: readonly vscode.Range[]): number | undefined {
	return ranges[0]?.start.line;
}

function selectionsEqual(
	left: readonly vscode.Selection[],
	right: readonly vscode.Selection[],
): boolean {
	return left.length === right.length && left.every((selection, index) => {
		const other = right[index];
		return other !== undefined && selection.isEqual(other);
	});
}
