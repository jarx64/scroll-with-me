import * as assert from 'assert';
import {
	evaluateScroll,
	ScrollAction,
	translateCaret,
} from '../scrollPolicy';

suite('Scroll policy', () => {
	test('translates by the viewport line delta', () => {
		const evaluation = evaluateScroll({
			currentAnchorLine: 15,
			enabled: true,
			hasExpandedSelection: false,
			navigationPending: false,
			previousAnchorLine: 10,
		});

		assert.deepStrictEqual(evaluation, {
			action: ScrollAction.TranslateCarets,
			lineDelta: 5,
		});
	});

	test('supports upward scrolling', () => {
		const evaluation = evaluateScroll({
			currentAnchorLine: 4,
			enabled: true,
			hasExpandedSelection: false,
			navigationPending: false,
			previousAnchorLine: 9,
		});

		assert.strictEqual(evaluation.lineDelta, -5);
		assert.strictEqual(evaluation.action, ScrollAction.TranslateCarets);
	});

	test('rebaselines when disabled, selecting text, navigating, or initializing', () => {
		const baseInput = {
			currentAnchorLine: 20,
			enabled: true,
			hasExpandedSelection: false,
			navigationPending: false,
			previousAnchorLine: 10,
		};

		for (const input of [
			{ ...baseInput, enabled: false },
			{ ...baseInput, hasExpandedSelection: true },
			{ ...baseInput, navigationPending: true },
			{ ...baseInput, previousAnchorLine: undefined },
		]) {
			assert.strictEqual(evaluateScroll(input).action, ScrollAction.Rebaseline);
		}
	});

	test('preserves the preferred character on long enough lines', () => {
		const translated = translateCaret({
			caret: { line: 10, character: 3 },
			lineDelta: 4,
			lineCount: 30,
			lineLengthAt: () => 20,
			preferredCharacter: 12,
		});

		assert.deepStrictEqual(translated, { line: 14, character: 12 });
	});

	test('clamps lines and characters to document bounds', () => {
		const translatedPastEnd = translateCaret({
			caret: { line: 8, character: 7 },
			lineDelta: 10,
			lineCount: 10,
			lineLengthAt: () => 4,
			preferredCharacter: 7,
		});
		const translatedPastStart = translateCaret({
			caret: { line: 2, character: 2 },
			lineDelta: -10,
			lineCount: 10,
			lineLengthAt: () => 20,
			preferredCharacter: 2,
		});

		assert.deepStrictEqual(translatedPastEnd, { line: 9, character: 4 });
		assert.deepStrictEqual(translatedPastStart, { line: 0, character: 2 });
	});
});
