import * as vscode from 'vscode';
import { EditorScrollController } from './editorScrollController';

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(new EditorScrollController());
}

export function deactivate(): void {}
