import * as vscode from 'vscode';

export enum ConfigurationSection {
	ScrollWithMe = 'scrollWithMe',
}

export enum ConfigurationKey {
	Enabled = 'enabled',
}

export const enabledConfigurationId =
	`${ConfigurationSection.ScrollWithMe}.${ConfigurationKey.Enabled}` as const;

const defaultEnabled = true;

export function isEnabledFor(editor: vscode.TextEditor): boolean {
	return vscode.workspace
		.getConfiguration(ConfigurationSection.ScrollWithMe, editor.document.uri)
		.get<boolean>(ConfigurationKey.Enabled, defaultEnabled);
}
