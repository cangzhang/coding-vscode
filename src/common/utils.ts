import { Event, Disposable, Uri } from 'vscode';

export interface PromiseAdapter<T, U> {
	(
		value: T,
		resolve:
			(value: U | PromiseLike<U>) => void,
		reject:
			(reason: any) => void
	): any;
}

const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value);

export async function promiseFromEvent<T, U>(
	event: Event<T>,
	adapter: PromiseAdapter<T, U> = passthrough): Promise<U> {
	let subscription: Disposable;
	return new Promise<U>((resolve, reject) =>
		subscription = event((value: T) => {
			try {
				Promise.resolve(adapter(value, resolve, reject))
					.catch(reject);
			} catch (error) {
				reject(error);
			}
		})
	).then(
		(result: U) => {
			subscription.dispose();
			return result;
		},
		error => {
			subscription.dispose();
			throw error;
		}
	);
}

export function parseQuery(uri: Uri) {
	return uri.query.split('&').reduce((prev: any, current) => {
		const queryString = current.split('=');
		prev[queryString[0]] = queryString[1];
		return prev;
	}, {});
}
