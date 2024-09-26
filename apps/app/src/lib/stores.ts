import { writable } from 'svelte/store';
import { persist, createLocalStorage } from '@macfja/svelte-persistent-store';

type EventType = 'updateMe' | 'otherEventType';

interface FutureMe {
	name: string;
	visionid: string;
	country_code: string;
}

interface Me {
	id: string;
	name?: string;
}

interface Event {
	type: EventType;
	payload: unknown;
}

export function emitEvent(event: Event) {
	eventStream.update((events) => [...events, event]);
}

const defaultFutureMe: FutureMe = { name: '', visionid: '', country_code: '' };
const defaultMe: Me = { id: '' };

export const eventStream = writable<Event[]>([]);

export const futureMe = persist(
	writable<FutureMe>(defaultFutureMe),
	createLocalStorage(),
	'futureMe'
);
export const Me = persist(writable<Me>(defaultMe), createLocalStorage(), 'Me');

type LogType = 'success' | 'error' | 'info' | 'default';

interface LogEntry {
	type: LogType;
	message: string;
	date: string;
	file: string;
	json?: unknown;
}

interface LogFunction {
	(type: LogType, message: string, json?: unknown): void;
	subscribe: (run: (value: LogEntry[]) => void) => () => void;
	clear: () => void;
}

function getFilePath(): string {
	if (import.meta.env.DEV) {
		const stack = new Error().stack;
		const stackLines = stack?.split('\n') || [];
		for (let i = 2; i < stackLines.length; i++) {
			const line = stackLines[i];
			if (line.includes(import.meta.env.BASE_PATH) && !line.includes('/src/lib/stores.ts')) {
				const match = line.match(/\((.*):\d+:\d+\)$/);
				if (match && match[1]) {
					const fullPath = match[1];
					const basePathIndex = fullPath.indexOf(import.meta.env.BASE_PATH);
					if (basePathIndex !== -1) {
						let path = fullPath.slice(basePathIndex + import.meta.env.BASE_PATH.length);
						const queryIndex = path.indexOf('?t=');
						if (queryIndex !== -1) {
							path = path.slice(0, queryIndex);
						}
						return path;
					}
				}
			}
		}
	}

	try {
		throw new Error();
	} catch (error) {
		if (error instanceof Error && error.stack) {
			const stackLines = error.stack.split('\n');
			for (const line of stackLines) {
				if (line.includes('at ') && !line.includes('/stores.ts')) {
					const match = line.match(/at (?:.*\()?(.+?)(?::\d+:\d+)?(?:\))?$/);
					if (match && match[1]) {
						return match[1].split('/').slice(-2).join('/');
					}
				}
			}
		}
	}

	return 'unknown';
}

const createLogger = (): LogFunction => {
	const { subscribe, update } = writable<LogEntry[]>([]);

	const logFunction = (type: LogType, message: string, json?: unknown) => {
		const file = getFilePath();
		update((logs) => {
			const newLogs = [
				...logs,
				{
					type,
					message,
					date: new Date().toISOString(),
					file,
					json
				}
			];
			return newLogs;
		});
	};

	logFunction.subscribe = subscribe;
	logFunction.clear = () => update(() => []);

	return logFunction;
};

export const log = createLogger();

export enum OnboardingState {
	Welcome = 'Welcome',
	VideoView = 'VideoView',
	Newsletter = 'Newsletter',
	Dashboard = 'Dashboard',
	Finished = 'Finished'
}

interface OnboardingMachine {
	state: OnboardingState;
	context: {
		remoteOnboarded: boolean;
		newsletterSubscribed: boolean;
	};
}

export enum OnboardingState {
	Welcome = 'Welcome',
	VideoView = 'VideoView',
	Newsletter = 'Newsletter',
	Dashboard = 'Dashboard',
	Finished = 'Finished'
}

function createOnboardingMachine() {
	const { subscribe, update } = persist(
		writable<OnboardingMachine>({
			state: OnboardingState.Welcome,
			context: {
				remoteOnboarded: false,
				newsletterSubscribed: false
			}
		}),
		createLocalStorage(),
		'onboardingMachine'
	);

	return {
		subscribe,
		transition: (event: string) => {
			update((machine: OnboardingMachine) => {
				console.log(`Transition event: ${event}, Current state: ${machine.state}`);
				let newState = machine.state;
				switch (machine.state) {
					case OnboardingState.Welcome:
						if (event === 'VIDEO_VIEWED') {
							newState = OnboardingState.VideoView;
						}
						break;
					case OnboardingState.VideoView:
						if (event === 'INVITE_MUTATED') {
							newState = OnboardingState.Newsletter;
						}
						break;
					case OnboardingState.Newsletter:
						if (event === 'NEWSLETTER_COMPLETED') {
							newState = OnboardingState.Dashboard;
						}
						break;
					case OnboardingState.Dashboard:
						if (event === 'TOOLTIP_CLICKED') {
							newState = OnboardingState.Finished;
						}
						break;
				}
				console.log(`New state after transition: ${newState}`);
				return { ...machine, state: newState };
			});
		},
		setRemoteOnboarded: (value: boolean) => {
			update((machine: OnboardingMachine) => ({
				...machine,
				context: { ...machine.context, remoteOnboarded: value },
				state: value ? OnboardingState.Finished : machine.state
			}));
		},
		setNewsletterSubscribed: (value: boolean) => {
			update((machine: OnboardingMachine) => ({
				...machine,
				context: { ...machine.context, newsletterSubscribed: value }
			}));
		}
	};
}

export const onboardingMachine = createOnboardingMachine();
