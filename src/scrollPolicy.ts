export enum ScrollAction {
	Rebaseline = 'rebaseline',
	TranslateCarets = 'translateCarets',
}

export interface ScrollEvaluationInput {
	readonly currentAnchorLine: number;
	readonly enabled: boolean;
	readonly hasExpandedSelection: boolean;
	readonly navigationPending: boolean;
	readonly previousAnchorLine: number | undefined;
}

export interface ScrollEvaluation {
	readonly action: ScrollAction;
	readonly lineDelta: number;
}

export interface CaretPosition {
	readonly character: number;
	readonly line: number;
}

export interface CaretTranslationInput {
	readonly caret: CaretPosition;
	readonly lineDelta: number;
	readonly lineLengthAt: (line: number) => number;
	readonly lineCount: number;
	readonly preferredCharacter: number;
}

export function evaluateScroll(input: ScrollEvaluationInput): ScrollEvaluation {
	if (
		!input.enabled ||
		input.hasExpandedSelection ||
		input.navigationPending ||
		input.previousAnchorLine === undefined
	) {
		return { action: ScrollAction.Rebaseline, lineDelta: 0 };
	}

	const lineDelta = input.currentAnchorLine - input.previousAnchorLine;
	return lineDelta === 0
		? { action: ScrollAction.Rebaseline, lineDelta }
		: { action: ScrollAction.TranslateCarets, lineDelta };
}

export function translateCaret(input: CaretTranslationInput): CaretPosition {
	const lastLine = Math.max(0, input.lineCount - 1);
	const line = clamp(input.caret.line + input.lineDelta, 0, lastLine);
	const character = clamp(input.preferredCharacter, 0, input.lineLengthAt(line));

	return { line, character };
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}
