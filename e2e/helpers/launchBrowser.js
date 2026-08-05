const {Builder} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
/**
 * Launches a Selenium WebDriver for the specified browser.
 * @param {string} browser - 'chrome', 'firefox', or 'edge'.
 * @param {boolean} headless - Whether to run headless.
 * @returns {Promise<WebDriver>}
 */
async function launchBrowser(browser = 'chrome', headless = true) {
  let builder = new Builder().forBrowser(browser);
  if (browser === 'chrome') {
    const options = new chrome.Options();
    if (headless) options.addArguments('--headless', '--disable-gpu', '--no-sandbox');
    builder.setChromeOptions(options);
  } else if (browser === 'firefox') {
    const options = new firefox.Options();
    if (headless) options.addArguments('-headless');
    builder.setFirefoxOptions(options);
  } else if (browser === 'edge') {
    const options = new edge.Options();
    if (headless) options.addArguments('headless');
    builder.setEdgeOptions(options);
  }
  return builder.build();
}
module.exports = { launchBrowser };
