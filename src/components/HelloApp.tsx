import React, { useEffect, useState } from 'react';
import '../index.css';

export interface Status {
    cedar: number | null;
    covid: number | null;
    crypto: number | null;
}

export default function HelloApp() {
    const [status, setStatus] = useState<Status>({
        cedar: 0,
        covid: 0,
        crypto: 0,
    });
    const [theme, setTheme] = useState<string>('light');
    useEffect(() => {
        window.api.receive(
            'theme',
            (darkMode: string) => {
                const isDarkMode = darkMode === 'dark';
                document.body.classList.toggle('dark', isDarkMode);
            },
            [theme]
        );
        window.api.receive('status', (data) => {
            console.log(`Received ${data} from main process`);
            console.log(data);
            setStatus(data);
        });
    }, [status]);

    return (
        <>
            <div className="timer">Hello from React!</div>
            <button className="py-2 px-3 bg-cyan-500 text-white text-sm font-semibold rounded-md shadow-lg shadow-cyan-500/50 focus:outline-none">
                Subscribe
            </button>
            <h1 className="text-3xl font-bold underline">Hello world 1!</h1>
            <h1>Hello world 2!</h1>
            {(status ?? status.cedar) && (
                <div>Cedar: {JSON.stringify(status)}</div>
            )}
        </>
    );
}
