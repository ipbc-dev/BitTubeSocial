/* eslint-disable no-console */
import * as registerPushNotifications from './actions/push_notifications';
import { setupBrowserNotifications } from './actions/notifications';
import { default as Mastodon, store } from './containers/mastodon';
import React from 'react';
import ReactDOM from 'react-dom';
import ready from './ready';
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime';

const perf = require('./performance');

const PLATFORMDISPLAY = 'bittube.social';
const PLATFORMUUID = '53d26a7b-1781-e570-bca0-4a1fa77c3596';
const setupData = {
  contentName: null,
  contentDisplayName: null,
  platformUUID: PLATFORMUUID,
  platformDisplayName: PLATFORMDISPLAY,
};

function main() {
  perf.start('main()');

  if (window.history && history.replaceState) {
    const { pathname, search, hash } = window.location;
    const path = pathname + search + hash;
    if (!(/^\/web($|\/)/).test(path)) {
      history.replaceState(null, document.title, `/web${path}`);
    }
  }

  ready(() => {
    const mountNode = document.getElementById('mastodon');
    const props = JSON.parse(mountNode.getAttribute('data-props'));

    ReactDOM.render(<Mastodon {...props} />, mountNode);
    store.dispatch(setupBrowserNotifications());
    if (process.env.NODE_ENV === 'production') {
      // avoid offline in dev mode because it's harder to debug
      require('offline-plugin/runtime').install();
      store.dispatch(registerPushNotifications.register());
    }
    perf.stop('main()');
    injectAirtimeScript();
  });
}

function injectAirtimeScript () {
  return new Promise((resolve, reject) => {
    try {
      const script = document.createElement('script');
      script.setAttribute('data-verify', 'none');
      script.setAttribute('data-autostart', 'false');
      script.src = 'https://bittubeapp.com/tubepay/airtime.loader.js';

      script.onload = () => {
        // console.log('Script on load !!!!! ')
        resolve();
      };
      script.onerror = (error) => {
        // console.log('Airtime Script on error', error)
        reject(error);
      };

      document.getElementsByTagName('head')[0].appendChild(script);
    } catch (err) {
      reject(err);
    }
  });
}



const _airtimeReadyHolder = {};
const _airtimeReadyPromise = new Promise((resolve, reject) => {
  _airtimeReadyHolder.resolve = resolve; _airtimeReadyHolder.reject = reject;
});

document.addEventListener('airtime-loaded', (event) => {
  console.log('== AIRTIME LOADED ==', event, window.airtime);
  setTimeout(trySetup, 10);
});

document.addEventListener('airtime-loaded-error', (event) => {
  console.log('== AIRTIME LOADING ERROR ==', event);
  _airtimeReadyHolder.reject();
});

let _lastSetupDataJson;
async function setAirtimeContentID (setupData) {
  await _airtimeReadyPromise;
  const setupDataJson = JSON.stringify(setupData);
  if (_lastSetupDataJson) {
    if (setupDataJson === _lastSetupDataJson) {
      console.log('== AIRTIME CONTENT ID UNCHANGED ==', setupData);
      return setupData;
    }
  }
  console.log('== AIRTIME SETTING CONTENT ID ==', setupData);
  window.airtime.setup(setupData);
  _lastSetupDataJson = setupDataJson;
  return setupData;
}

let retries = 0;
function trySetup () {
  if (window.airtime) {
    console.log('== AIRTIME SETUP ==');
    _airtimeReadyHolder.resolve();
    setAirtimeContentID( setupData );
  } else {
    console.log('== AIRTIME SETUP WAITING ==');
    if (retries < 10) {
      retries++;
      setTimeout(trySetup, 10 * retries);
    } else {
      console.warn('== AIRTIME SETUP TOO MANY RETRIES ==');
      _airtimeReadyHolder.reject();
    }
  }
}

export default main;
