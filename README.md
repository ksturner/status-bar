# Status Bar Application

This is a personal project I wrote to display a few bits of data in my Mac's desktop status/title bar
area. The application is written with Javascript/Typescript using electron via the `electron-forge`
framework along with TailWindCSS and React.js for the window UI. Clicking any of the entries in the
status bar's dropdown menu opens your browser to the data's source web page for more inspection.

![Screenshot of Application](./screenshot.png)

## Information Collected

The app is hardcoded to display a few personally relevant bits of information, which probably won't
appeal to anyone else specifically. They are:

-   Daily new covid cases in Williamson County, Texas
-   Any recorded cedar pollen (useful Dec-Feb) in the air in Austin, TX
-   Crypto quotes for BTC, ETH, and MATIC

## Interesting Technology Aspects

From the tech perspective, this project demonstrates a few unique things that are harder to find examples of online.

1. Because some of the data is web scraped from dynamic websites, we can't just
   use a standard web page fetch to get this data. Instead we use a headless
   version of Chrome via the Puppeteer framework to instantiate a hidden browser
   that navigates through a few pages of data if necessary to get the information
   we need. Currently the county covid data and the allergy/pollen reports use this
   browser approach because both sites rely heavily on dynamic javascript.

1. The bulk of the data collection is done in the main Electron process, which
   is generally frowned upon for the simple fact that if you code this poorly, and
   it blocks this main process, any child view renderer processes are also blocked.
   A _LOT_ of Electron examples therefore suggest and show you how to put this
   logic into your renderer processes. However, for our case, we needed to run
   Puppeteer, and update not just the one window view, but also the status bar
   icons and drop down menus. Running the data collection logic in the main process
   was therefore best positioned to collect the data and then emit event updates to
   the various UI pieces that needed it.

## Getting Started
