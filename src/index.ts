import {
    app,
    ipcMain,
    nativeTheme,
    BrowserWindow,
    Menu,
    Tray,
    MenuItem,
    MenuItemConstructorOptions,
    shell,
} from 'electron';

import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import fs from 'fs'; // for logging to disk

// This allows TypeScript to pick up the magic constant that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let tray: Tray | null = null;
let timer: NodeJS.Timeout | null = null;
let mainWindow: BrowserWindow | null = null;
const urlAllergy = 'https://www.kvue.com/allergy';
const urlWilcoCovid =
    'https://experience.arcgis.com/experience/ae30cf23f70b40fda5a4804e7601eee9'; // main wilco covid dashboard page
const urlCrypto = 'https://www.coingecko.com/';

let menuItems: (MenuItemConstructorOptions | MenuItem)[] = [
    {
        label: 'Loading Austin cedar data...',
        click() {
            shell.openExternal(urlAllergy);
        },
    },
    {
        label: 'Loading Wilco covid data...',
        click() {
            shell.openExternal(urlWilcoCovid);
        },
    },
    {
        label: 'Loading BTC price',
        click() {
            shell.openExternal(urlCrypto + 'en/coins/bitcoin');
        },
    },
    {
        label: 'Loading ETH price',
        click() {
            shell.openExternal(urlCrypto + 'en/coins/ethereum');
        },
    },
    {
        label: 'Loading MATIC price',
        click() {
            shell.openExternal(urlCrypto + 'en/coins/polygon');
        },
    },
    { type: 'separator' },
    {
        label: 'View Dashboard',
        async click() {
            if (!mainWindow) await createWindow();
            mainWindow.show();
        },
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
];
type Status = {
    cedar: {
        text: string;
        datetime?: Date;
    };
    covid: {
        text: string;
        datetime?: Date;
    };
    crypto: {
        eth: {
            price: number;
            volume24: number;
            change24: number;
            datetime: Date;
        };
        btc: {
            price: number;
            volume24: number;
            change24: number;
            datetime: Date;
        };
        matic: {
            price: number;
            volume24: number;
            change24: number;
            datetime: Date;
        };
    };
};

const status: Status = {
    cedar: {
        text: null,
    },
    covid: {
        text: null,
    },
    crypto: {
        eth: null,
        btc: null,
        matic: null,
    },
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const createWindow = (): void => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 500,
        width: 300,
        icon: path.join(
            __dirname,
            'static/AppIcon.appiconset/icon_256x256.png'
        ),
        webPreferences: {
            // See: https://stackoverflow.com/questions/62467092/electron-forge-cant-use-ipcrenderer-in-the-renderer-file
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
};
async function createBrowser(options = {}): Promise<puppeteer.Browser> {
    const chromePath = getChromiumExecPath();
    // @ts-ignore
    const browserFetcher = puppeteer.createBrowserFetcher();
    await browserFetcher.download('950341');

    return puppeteer.launch({
        ...options,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
}

function getChromiumExecPath() {
    return (
        puppeteer
            // @ts-ignore
            .executablePath()
            .replace('app.asar', 'app.asar.unpacked')
    );
}
const getIcon = () => {
    const isDarkMode = nativeTheme.shouldUseDarkColors;
    if (isDarkMode) return 'icon_16x16@2x.png';
    return 'iconlight_16x16@2x.png';
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    await createWindow();

    // Even though the actions are associated with the window UI, we
    // only need to create or hook them up once.
    ipcMain.handle('dark-mode:toggle', () => {
        const isDarkMode = nativeTheme.shouldUseDarkColors;
        nativeTheme.themeSource = isDarkMode ? 'light' : 'dark';
        if (mainWindow)
            mainWindow.webContents.send('theme', nativeTheme.themeSource);
        return isDarkMode;
    });
    ipcMain.handle('dark-mode:system', () => {
        if (mainWindow) mainWindow.webContents.send('theme', status);
        nativeTheme.themeSource = 'system';
    });

    // TODO: need to load a local icon .. and make sure it gets saved inside the app data folder
    //const p = path.join(__dirname, 'static', 'icon_16x16@2x.png');
    const p = path.join(__dirname, 'static', getIcon());
    tray = new Tray(p);
    // TODO: eventually we will have to figure out how to create dynamic menu items
    const contextMenu = Menu.buildFromTemplate(menuItems);
    tray.setToolTip("Kevin's Status Application");
    tray.setTitle('loading...');
    tray.setContextMenu(contextMenu);

    app.emit('status:cedar', 'tock');
    app.emit('status:covid', 'tock');
    app.emit('status:crypto', 'tock2');
    timer = setInterval(() => {
        app.emit('status:cedar', 'tock');
        app.emit('status:covid', 'tock');
        // app.dock.setBadge('190ppm'); // This little snip works.. pretty cool, imho
    }, 3600 * 1000); // every hour
    timer = setInterval(() => {
        app.emit('status:crypto', 'tock2');
    }, 20 * 1000); // every 20 seconds
});

async function findCalendarUrl(
    content: string,
    urlSubstring: string = 'keepandshare.com'
): Promise<string | null> {
    const { document } = new JSDOM(content).window;
    const iframes = document.getElementsByTagName('iframe');

    let iframe: HTMLIFrameElement | null = null;
    for (const f of iframes) {
        if (f.src.includes(urlSubstring)) {
            iframe = f;
            break;
        }
    }
    return iframe.src;
}
// @ts-ignore
app.on('status:update', async (message) => {
    const covidText = status.covid?.text ? `🦠: ${status.covid?.text}` : '';
    const cedarText = status.cedar?.text ? `🌲: ${status.cedar?.text}` : '';

    const maticTrend = status.crypto?.matic?.change24 > 0 ? '📈' : '📉';
    const btcTrend = status.crypto?.btc?.change24 > 0 ? '📈' : '📉';

    console.log(status); // Good debug of what data is present upon updates.

    let cryptoText = status?.crypto?.btc
        ? `${btcTrend}$btc: ${Math.round(status.crypto.btc.price)}`
        : '';
    cryptoText += status?.crypto?.matic
        ? `${maticTrend}$matic: ${
              Math.round(status.crypto.matic.price * 10000) / 10000
          }`
        : '';
    const statusText = `${covidText}${cedarText}${cryptoText}`;
    tray.setTitle(statusText);
    if (mainWindow) mainWindow.webContents.send('status', status);
});

// @ts-ignore
app.on('status:cedar', async (message) => {
    const url = urlAllergy;
    try {
        const browser = await createBrowser();
        if (browser) {
            const page = await browser.newPage();
            await page.goto(url);

            // await page.screenshot({ path: 'screenshot.png' });
            const content = await page.content();

            // Here we need to find the url to the iframe of the full calendar and open that.
            let calUrl: string | null = await findCalendarUrl(content);
            calUrl = await findCalendarUrl(content);

            if (calUrl) {
                await page.goto(calUrl);
                await page.waitForSelector(
                    '.cal_display_monthdatenumber_bgcolor'
                );
            } else {
                console.log('calUrl not found');
            }
            const cssSelector = '.cal_display_todaycolor';

            const allText = await page.$$eval(cssSelector, (nodes: any) =>
                nodes.map((n: any) => n.innerText)
            );
            if (allText.length > 1) {
                const text = allText[1];
                console.log('setting text to: ' + text);
                if (tray) {
                    const m = text.match(/Cedar (\d+)/i);
                    if (m) {
                        const cedarPollen = m[1];
                        status.cedar = {
                            text: `${Number(cedarPollen)}`,
                            datetime: new Date(),
                        };
                        app.emit('status:update', 'tock');
                    } else {
                        status.cedar = {
                            text: '0',
                            datetime: new Date(),
                        };
                    }
                    menuItems[0].label = text;
                    menuItems[0].click = () => {
                        shell.openExternal(url);
                    };
                    const contextMenu = Menu.buildFromTemplate(menuItems);
                    tray.setContextMenu(contextMenu);
                }
            }
        } else {
            console.log('browser is null');
        }
        if (browser) {
            await browser.close();
        }
    } catch (e) {
        console.log(e);
    }
});

// @ts-ignore
app.on('status:covid', async (message) => {
    const url = urlWilcoCovid;
    try {
        const browser = await createBrowser();
        if (browser) {
            const page = await browser.newPage();
            await page.goto(url);
            console.log('navigated to ' + url);

            await sleep(12000);
            let content = await page.content();

            let jsdom = new JSDOM(content);
            let { document } = jsdom.window;

            const iframe = document.getElementById('ifrSafe');
            if (!iframe) {
                console.log('could not find iframe for covid data');
                return;
            }
            await page.goto(iframe.src);
            await sleep(12000);
            // console.log('slept for initial 12 seconds');
            // await page.screenshot({ path: 'screenshot.png' });
            // console.log('screenshot taken');
            // await sleep(1000);
            // console.log('slept for 4 more seconds');
            content = await page.content();

            jsdom = new JSDOM(content);
            document = jsdom.window.document;

            // console.log('trying to get text');
            // fs.writeFileSync('content.html', jsdom.serialize());
            const sel =
                'body > div.full-page-container.bg-background > calcite-shell > div.dashboard-container.shadow-2.calcite-theme-dark.flex.flex-auto.flex-col.overflow-hidden > div.flex-auto.flex.relative.overflow-hidden > div > div > div > margin-container > full-container > div:nth-child(5) > margin-container > full-container > div > div.widget-body.flex-auto.w-full.flex.flex-col.justify-center.overflow-hidden > div > div.responsive-text.flex.flex-col.flex-none.shrink.overflow-hidden.indicator-center-text > svg > g.responsive-text-label > text';
            const element = document.querySelector(sel);
            if (element) {
                const text = element.textContent;
                status.covid = {
                    text: `${Number(text.trim())}`,
                    datetime: new Date(),
                };
                const menuText = `Daily New Covid Cases in Wilco: ${status.covid.text}`;
                menuItems[1].label = menuText;
                const contextMenu = Menu.buildFromTemplate(menuItems);
                tray.setContextMenu(contextMenu);
                app.emit('status:update', 'tock');
            } else {
                console.log('no element found');
            }
        }
        if (browser) {
            await browser.close();
        }
    } catch (e) {
        console.log(e);
    }
});

// @ts-ignore
app.on('status:crypto', async (message) => {
    const baseUrl = 'https://api.coingecko.com/api/v3/';
    const coins = ['bitcoin', 'ethereum', 'matic-network'];
    const url =
        baseUrl +
        `/simple/price?ids=${encodeURI(
            coins.join(',')
        )}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

    try {
        axios
            .get(url)
            .then((response) => {
                const data = response?.data;
                status.crypto.eth = {
                    price: data?.ethereum?.usd,
                    volume24: data?.ethereum?.usd_24h_vol,
                    change24: data?.ethereum?.usd_24h_change,
                    datetime: new Date(),
                };
                status.crypto.btc = {
                    price: data?.bitcoin?.usd,
                    volume24: data?.bitcoin?.usd_24h_vol,
                    change24: data?.bitcoin?.usd_24h_change,
                    datetime: new Date(),
                };
                status.crypto.matic = {
                    price: data?.['matic-network']?.usd,
                    volume24: data?.['matic-network']?.usd_24h_vol,
                    change24: data?.['matic-network']?.usd_24h_change,
                    datetime: new Date(),
                };
                menuItems[2].label = `BTC: ${status.crypto.btc.price}`;
                menuItems[3].label = `ETH: ${status.crypto.eth.price}`;
                menuItems[4].label = `MATIC: ${status.crypto.matic.price}`;
                const contextMenu = Menu.buildFromTemplate(menuItems);
                tray.setContextMenu(contextMenu);
                app.emit('status:update', 'tock');
            })
            .catch((error) => {
                console.error(error);
            });
    } catch (e) {
        console.log(e);
    }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    mainWindow = null;
});
app.on('will-quit', async () => {
    // NOTE: I'm not sure the timer cleanup is really necessary but feel it's good to do it.
    if (timer) {
        console.log('clearing timer');
        clearInterval(timer);
    }
    // if (browser) {
    //     console.log('closing browser');
    //     await browser.close();
    //     browser = null;
    // }
});

app.on('activate', async () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.