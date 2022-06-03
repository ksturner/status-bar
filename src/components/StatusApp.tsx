import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import '../index.css';

export interface TickerData {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    marketCap: number | null;
    volume: number | null;
    high: number | null;
    low: number | null;
    datetime: Date | null;
    volume24: number | null;
    change24: number | null;
}
export interface Status {
    cedar: {
        text: string | null;
        datetime: Date | null;
    };
    covid: {
        text: string | null;
        datetime: Date | null;
    };
    crypto: {
        eth: TickerData;
        btc: TickerData;
        matic: TickerData;
    };
}

export default function StatusApp() {
    const [status, setStatus] = useState<Status>({
        cedar: null,
        covid: null,
        crypto: null,
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
            setStatus(data);
        });
    }, []);

    return (
        <>
            {(status ?? status.cedar) && (
                <section className="text-gray-600 body-font bg-gradient-to-b from-sky-200">
                    <div className="container px-4 py-4 mx-auto flex flex-wrap bg-transparent">
                        <div className="flex flex-wrap -mx-4 mt-auto mb-auto lg:w-1/2 sm:w-2/3 content-start sm:pr-10">
                            <div className="w-full sm:p-2 px-2 mb-3">
                                <h1 className="title-font font-medium text-xl mb-2 text-gray-900">
                                    Dashboard
                                </h1>
                                <div className="leading-relaxed">&nbsp;</div>
                            </div>
                            <div className="p-2 sm:w-1/2 lg:w-1/4 w-1/2">
                                <h2 className="title-font font-medium text-xl text-gray-900">
                                    {status.cedar?.text ?? 'Loading...'}
                                </h2>
                                <p className="leading-relaxed">Cedar (ppm)</p>
                            </div>
                            <div className="p-2 sm:w-1/2 lg:w-1/4 w-1/2">
                                <h2 className="title-font font-medium text-xl text-gray-900">
                                    {status.covid?.text ?? 'Loading...'}
                                </h2>
                                <p className="leading-relaxed">
                                    New Covid Cases
                                </p>
                            </div>
                            <div className="p-2 sm:w-1/2 lg:w-1/4 w-1/2">
                                <h2 className="title-font font-medium text-xl text-gray-900">
                                    {status.crypto?.btc?.price ?? 'Loading...'}
                                </h2>
                                <p className="leading-relaxed">
                                    BTC (
                                    {status.crypto?.btc?.datetime
                                        ? format(
                                              status.crypto?.btc?.datetime,
                                              'p'
                                          )
                                        : null}
                                    )
                                </p>
                            </div>
                            <div className="p-2 sm:w-1/2 lg:w-1/4 w-1/2">
                                <h2 className="title-font font-medium text-xl text-gray-900">
                                    {status.crypto?.eth?.price ?? 'Loading...'}
                                </h2>
                                <p className="leading-relaxed">
                                    ETH (
                                    {status.crypto?.eth?.datetime
                                        ? format(
                                              status.crypto?.eth?.datetime,
                                              'p'
                                          )
                                        : null}
                                    )
                                </p>
                            </div>
                            <div className="p-2 sm:w-1/2 lg:w-1/4 w-1/2">
                                <h2 className="title-font font-medium text-xl text-gray-900">
                                    {status.crypto?.matic?.price ??
                                        'Loading...'}
                                </h2>
                                <p className="leading-relaxed">
                                    Matic (
                                    {status.crypto?.matic?.datetime
                                        ? format(
                                              status.crypto?.matic?.datetime,
                                              'p'
                                          )
                                        : null}
                                    )
                                </p>
                            </div>
                        </div>
                        <div className="lg:w-1/2 sm:w-1/3 w-full rounded-lg overflow-hidden mt-6 sm:mt-0">
                            {/* put something else here on a new row */}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
