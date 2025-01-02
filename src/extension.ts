import * as vscode from 'vscode';

async function pushSnippet(content: string | undefined, file: string | undefined, language: string | undefined) {
	const config = vscode.workspace.getConfiguration('bytestash');
	const config_url = config.url;
	const config_key = config.key;
	const config_quick = config.quick;
	const config_fileNameAsTitle = config.filenameAsTitle;
	const config_public = config.public;

	if(config_url === null || config_url === undefined)
	{
		vscode.window.showInformationMessage('ByteStash URL was not configured!');
		return;
	}

	if(config_key === null || config_key === undefined)
	{
		vscode.window.showInformationMessage('ByteStash API key was not configured!');
		return;
	}

	if(content === null || content === undefined || content === '')
	{
		vscode.window.showInformationMessage('Unable to find any content to upload!');
		return;
	}

	const default_name = file === '' || !config_fileNameAsTitle ? crypto.randomUUID() : file;
	const default_description = 'Uploaded from VS Code';
	const default_category = 'vscode';
	// Ask for name
	const name = config_quick ? default_name : await vscode.window.showInputBox({
		prompt: 'Enter a name:',
		value: default_name
	});

	// Ask for a description
	const description = config_quick ? default_description : await vscode.window.showInputBox({
		prompt: 'Enter a description:',
		value: default_description
	});

	// Ask for a category
	const category = config_quick ? default_category : await vscode.window.showInputBox({
		prompt: 'Enter a category:',
		value: default_category
	});

	// Compose fragments
	const fragments = [
		{
			file_name: file,
			code: content,
			language: language
		}
	];

	const fragments_json = JSON.stringify(fragments);

	// Compose body
	const body = {
		title: name,
		description: description,
		categories: category,
		isPublic: config_public.toString(),
		fragments: fragments_json
	};

	const body_json = JSON.stringify(body);

	const response = await fetch(`${config_url}/api/v1/snippets/push`, {
		method: 'POST',
		body: body_json,
		headers: { 'Content-Type': 'application/json', 'x-api-key': config_key }
	});

	if(response.ok)
	{
		vscode.window.showInformationMessage(`Snippet uploaded successfully!`);
	}
	else {
		response.text().then(function (text) {
			vscode.window.showInformationMessage(text);
		});
		
	}
}

function getDocument() {
	const editor = vscode.window.activeTextEditor;
	
	if(editor)
	{
		return editor.document;
	}
	
	return undefined;
}

function getSelection() {
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		return editor.selection;
	}

	return undefined;
}

function getContent() {
	const document = getDocument();

	if(document)
	{
		return document.getText();
	}

	return undefined;
}

function getFileName() {
	const document = getDocument();

	if(document)
	{
		const nameArray = document.fileName.split('/');
		return nameArray[nameArray.length - 1];
	}

	return undefined;
}

function getFileLanguage() {
	const document = getDocument();

	if (document) {
		return document.languageId;
	}

	return undefined;
}

function getSelectionContent() {
	const document = getDocument();
	const selection = getSelection();

	if (document && selection) {
		return document.getText(selection);
	}

	return undefined;
}

export function activate(context: vscode.ExtensionContext) {
	const disposable_all = vscode.commands.registerCommand('bytestash.pushAll', () => {
		pushSnippet(getContent(), getFileName(), getFileLanguage());
	});

	const disposable_selection = vscode.commands.registerCommand('bytestash.pushSelected', () => {
		pushSnippet(getSelectionContent(), getFileName(), getFileLanguage());
	});

	context.subscriptions.push(disposable_all);
	context.subscriptions.push(disposable_selection);
}
export function deactivate() {}
