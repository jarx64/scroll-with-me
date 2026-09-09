import * as assert from 'assert';
import * as vscode from 'vscode';
import { enabledConfigurationId } from '../configuration';
import { activate } from '../extension';

suite('Extension Test Suite', () => {
	test('configuration is contributed and enabled by default', () => {
		const configuration = vscode.workspace.getConfiguration();
		assert.strictEqual(configuration.get<boolean>(enabledConfigurationId), true);
	});

	test('activation registers disposable state', () => {
		const subscriptions: { dispose(): unknown }[] = [];
		activate({ subscriptions } as unknown as vscode.ExtensionContext);
		assert.strictEqual(subscriptions.length, 1);
		subscriptions[0]?.dispose();
	});
});
