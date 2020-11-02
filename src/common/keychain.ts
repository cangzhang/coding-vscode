// keytar depends on a native module shipped in vscode, so this is
// how we load it
import * as vscode from 'vscode';
import * as keytar from 'keytar';
import type * as keytarType from 'keytar';
// import * as nls from 'vscode-nls';

import Logger from './logger';
import { TokenType } from '../typings/commonTypes';

// const localize = nls.loadMessageBundle();

function getKeytar(): Keytar | undefined {
	try {
		return require('keytar');
	} catch (err) {
		console.log(err);
	}

	return undefined;
}

export type Keytar = {
	getPassword: typeof keytarType['getPassword'];
	setPassword: typeof keytarType['setPassword'];
	deletePassword: typeof keytarType['deletePassword'];
};

const SERVICE_ID = `coding.auth`;

export class Keychain {
	async setToken(token: string, t: TokenType): Promise<void> {
		try {
			return await keytar.setPassword(SERVICE_ID, t, token);
		} catch (e) {
			// Ignore
			Logger.error(`Setting token failed: ${e}`);
			await vscode.window.showErrorMessage(`Writing login information to the keychain failed with error: ${e.message}.`);
		}
	}

	async getToken(t: TokenType): Promise<string | null | undefined> {
		try {
			return await keytar.getPassword(SERVICE_ID, t);
		} catch (e) {
			// Ignore
			Logger.error(`Getting token failed: ${e}`);
			return Promise.resolve(undefined);
		}
	}

  async tryMigrate(t: TokenType): Promise<string | null | undefined> {
    try {
      const keytar = getKeytar();
      if (!keytar) {
        throw new Error('keytar unavailable');
      }

      const oldValue = await keytar.getPassword(`${vscode.env.uriScheme}-coding.login`, 'account');
      if (oldValue) {
        await this.setToken(oldValue, t);
        await keytar.deletePassword(`${vscode.env.uriScheme}-coding.login`, 'account');
      }

      return oldValue;
    } catch (_) {
      // Ignore
      return Promise.resolve(undefined);
    }
  }

  async deleteToken(t: TokenType): Promise<boolean | undefined> {
		try {
			return await keytar.deletePassword(SERVICE_ID, t);
		} catch (e) {
			// Ignore
			Logger.error(`Deleting token failed: ${e}`);
			return Promise.resolve(undefined);
		}
	}
}

export const keychain = new Keychain();
