type LogLevel = 'info' | 'error' | 'debug';

export const agentLogger = {
    log: (agent: string, message: string, data?: any, level: LogLevel = 'info') => {
        const timestamp = new Date().toISOString();
        const logPrefix = `[${agent}]`;

        if (level === 'error') {
            console.error(`${logPrefix} ${message}`, data ? { timestamp, ...data } : { timestamp });
            return;
        }

        if (level === 'debug' && process.env.NODE_ENV === 'development') {
            console.debug(`${logPrefix} ${message}`, data ? { timestamp, ...data } : { timestamp });
            return;
        }

        console.log(`${logPrefix} ${message}`, data ? { timestamp, ...data } : { timestamp });
    }
}; 