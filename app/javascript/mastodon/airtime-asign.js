const _airtimeReadyHolder = {};
const _airtimeReadyPromise = new Promise((resolve, reject) => {
  _airtimeReadyHolder.resolve = resolve; _airtimeReadyHolder.reject = reject;
});
const PLATFORMDISPLAY = 'bittube.social';
const PLATFORMUUID = '53d26a7b-1781-e570-bca0-4a1fa77c3596';
const setupData = {
  contentName: null,
  contentDisplayName: null,
  platformUUID: PLATFORMUUID,
  platformDisplayName: PLATFORMDISPLAY,
};
let _lastSetupDataJson;

export function setContentIdFromAccount (acctName) {
  console.log('ICEICE acctName at airtimeAsign is: ', acctName);
  const setupData = {
    contentName: acctName,
    contentDisplayName: acctName !== null ? 'BitTube.social ' + acctName : null,
    platformUUID: PLATFORMUUID,
    platformDisplayName: PLATFORMDISPLAY,
  };
  return setAirtimeContentID(setupData);
}

export function setContentIdEmpty () {
  const setupData = {
    contentName: null,
    contentDisplayName: null,
    platformUUID: PLATFORMUUID,
    platformDisplayName: PLATFORMDISPLAY,
  };
  console.log('ICEICE Airtime setContentIdEmpty()');
  return setAirtimeContentID(setupData);
}

export async function setAirtimeContentID (setupData) {
  await _airtimeReadyPromise;
  const setupDataJson = JSON.stringify(setupData);
  if (_lastSetupDataJson) {
    if (setupDataJson === _lastSetupDataJson) {
      console.log('ICEICE == AIRTIME CONTENT ID UNCHANGED ==', setupData);
      return setupData;
    }
  }
  console.log('ICEICE == AIRTIME SETTING CONTENT ID ==', setupData);
  window.airtime.setup(setupData);
  _lastSetupDataJson = setupDataJson;
  return setupData;
}

export function injectAirtimeScript () {
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

document.addEventListener('airtime-loaded', (event) => {
  console.log('== AIRTIME LOADED ==', event, window.airtime);
  setTimeout(trySetup, 10);
});

document.addEventListener('airtime-loaded-error', (event) => {
  console.log('== AIRTIME LOADING ERROR ==', event);
  _airtimeReadyHolder.reject();
});


let retries = 0;
export function trySetup () {
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