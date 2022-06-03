/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

declare global {
    interface Window {
        darkMode: any;
        api: any;
    }
}
import './index.css';
import './app';

// document
//     .getElementById('toggle-dark-mode')
//     .addEventListener('click', async () => {
//         const isDarkMode = await window.darkMode.toggle();
//         document.getElementById('theme-source').innerHTML = isDarkMode
//             ? 'Dark'
//             : 'Light';
//     });

// document
//     .getElementById('reset-to-system')
//     .addEventListener('click', async () => {
//         await window.darkMode.system();
//         document.getElementById('theme-source').innerHTML = 'System';
//     });
