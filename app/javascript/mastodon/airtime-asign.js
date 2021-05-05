const _airtimeReadyHolder = {}
const _airtimeReadyPromise = new Promise((resolve, reject) => { _airtimeReadyHolder.resolve = resolve; _airtimeReadyHolder.reject = reject })
const PLATFORMDISPLAY = 'bittube.social';
const PLATFORMUUID = '53d26a7b-1781-e570-bca0-4a1fa77c3596';
let _lastSetupDataJson

export function getContentIdFromAccount (userName) {
    return {
      contentName: userName + '@bittube.social',
      contentDisplayName: 'BitTubeSocial ' + userName + '@bittube.social', //Check with Jorge
      platformUUID: shared.PLATFORMUUID,
      platformDisplayName: shared.PLATFORMDISPLAY
    }
  }

export function setContentIdEmpty () {
    const setupData = {
        contentName: null,
        contentDisplayName: null,
        platformUUID: shared.PLATFORMUUID,
        platformDisplayName: shared.PLATFORMDISPLAY
    }
    console.log('ICEICE Airtime setContentIdEmpty()')
    return setAirtimeContentID(setupData)
}

export async function setAirtimeContentID (setupData) {
    await _airtimeReadyPromise
    const setupDataJson = JSON.stringify(setupData)
    if (_lastSetupDataJson) {
      if (setupDataJson === _lastSetupDataJson) {
        shared.debug('== AIRTIME CONTENT ID UNCHANGED ==', setupData)
        return setupData
      }
    }
    shared.debug('== AIRTIME SETTING CONTENT ID ==', setupData)
    window.airtime.setup(setupData)
    _lastSetupDataJson = setupDataJson
    return setupData
}