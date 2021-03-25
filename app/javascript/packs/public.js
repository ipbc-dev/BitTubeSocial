import './public-path';
import escapeTextContentForBrowser from 'escape-html';
import loadPolyfills from '../mastodon/load_polyfills';
import ready from '../mastodon/ready';
import { start } from '../mastodon/common';
import loadKeyboardExtensions from '../mastodon/load_keyboard_extensions';
import regeneratorRuntime from 'regenerator-runtime';

const debugFile = false;
const PLATFORMDISPLAY = 'PeerTube Federation';
const PLATFORMUUID = 'a93e5513-4772-e3d0-8b9f-82bfe73a71de';
const setupData = {
  contentName: null,
  contentDisplayName: null,
  platformUUID: PLATFORMUUID,
  platformDisplayName: PLATFORMDISPLAY,
};

start();

window.addEventListener('message', e => {
  const data = e.data || {};

  if (!window.parent || data.type !== 'setHeight') {
    return;
  }

  ready(() => {
    window.parent.postMessage({
      type: 'setHeight',
      id: data.id,
      height: document.getElementsByTagName('html')[0].scrollHeight,
    }, '*');
  });
});

function main() {
  const IntlMessageFormat = require('intl-messageformat').default;
  const { timeAgoString } = require('../mastodon/components/relative_timestamp');
  const { delegate } = require('@rails/ujs');
  const emojify = require('../mastodon/features/emoji/emoji').default;
  const { getLocale } = require('../mastodon/locales');
  const { messages } = getLocale();
  const React = require('react');
  const ReactDOM = require('react-dom');
  const Rellax = require('rellax');
  const { createBrowserHistory } = require('history');

  const scrollToDetailedStatus = () => {
    const history = createBrowserHistory();
    const detailedStatuses = document.querySelectorAll('.public-layout .detailed-status');
    const location = history.location;

    if (detailedStatuses.length === 1 && (!location.state || !location.state.scrolledToDetailedStatus)) {
      detailedStatuses[0].scrollIntoView();
      history.replace(location.pathname, { ...location.state, scrolledToDetailedStatus: true });
    }
  };

  const getEmojiAnimationHandler = (swapTo) => {
    return ({ target }) => {
      target.src = target.getAttribute(swapTo);
    };
  };

  ready(() => {
    const locale = document.documentElement.lang;

    const dateTimeFormat = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    [].forEach.call(document.querySelectorAll('.emojify'), (content) => {
      content.innerHTML = emojify(content.innerHTML);
    });

    [].forEach.call(document.querySelectorAll('time.formatted'), (content) => {
      const datetime = new Date(content.getAttribute('datetime'));
      const formattedDate = dateTimeFormat.format(datetime);

      content.title = formattedDate;
      content.textContent = formattedDate;
    });

    [].forEach.call(document.querySelectorAll('time.time-ago'), (content) => {
      const datetime = new Date(content.getAttribute('datetime'));
      const now      = new Date();

      content.title = dateTimeFormat.format(datetime);
      content.textContent = timeAgoString({
        formatMessage: ({ id, defaultMessage }, values) => (new IntlMessageFormat(messages[id] || defaultMessage, locale)).format(values),
        formatDate: (date, options) => (new Intl.DateTimeFormat(locale, options)).format(date),
      }, datetime, now, now.getFullYear(), content.getAttribute('datetime').includes('T'));
    });

    const reactComponents = document.querySelectorAll('[data-component]');

    if (reactComponents.length > 0) {
      import(/* webpackChunkName: "containers/media_container" */ '../mastodon/containers/media_container')
        .then(({ default: MediaContainer }) => {
          [].forEach.call(reactComponents, (component) => {
            [].forEach.call(component.children, (child) => {
              component.removeChild(child);
            });
          });

          const content = document.createElement('div');

          ReactDOM.render(<MediaContainer locale={locale} components={reactComponents} />, content);
          document.body.appendChild(content);
          scrollToDetailedStatus();
        })
        .catch(error => {
          console.error(error);
          scrollToDetailedStatus();
        });
    } else {
      scrollToDetailedStatus();
    }

    const parallaxComponents = document.querySelectorAll('.parallax');

    if (parallaxComponents.length > 0 ) {
      new Rellax('.parallax', { speed: -1 });
    }

    delegate(document, '#registration_user_password_confirmation,#registration_user_password', 'input', () => {
      const password = document.getElementById('registration_user_password');
      const confirmation = document.getElementById('registration_user_password_confirmation');
      if (password.value && password.value !== confirmation.value) {
        confirmation.setCustomValidity((new IntlMessageFormat(messages['password_confirmation.mismatching'] || 'Password confirmation does not match', locale)).format());
      } else {
        confirmation.setCustomValidity('');
      }
    });

    delegate(document, '#user_password,#user_password_confirmation', 'input', () => {
      const password = document.getElementById('user_password');
      const confirmation = document.getElementById('user_password_confirmation');
      if (!confirmation) return;

      if (password.value && password.value !== confirmation.value) {
        confirmation.setCustomValidity((new IntlMessageFormat(messages['password_confirmation.mismatching'] || 'Password confirmation does not match', locale)).format());
      } else {
        confirmation.setCustomValidity('');
      }
    });

    delegate(document, '.custom-emoji', 'mouseover', getEmojiAnimationHandler('data-original'));
    delegate(document, '.custom-emoji', 'mouseout', getEmojiAnimationHandler('data-static'));

    delegate(document, '.status__content__spoiler-link', 'click', function() {
      const statusEl = this.parentNode.parentNode;

      if (statusEl.dataset.spoiler === 'expanded') {
        statusEl.dataset.spoiler = 'folded';
        this.textContent = (new IntlMessageFormat(messages['status.show_more'] || 'Show more', locale)).format();
      } else {
        statusEl.dataset.spoiler = 'expanded';
        this.textContent = (new IntlMessageFormat(messages['status.show_less'] || 'Show less', locale)).format();
      }

      return false;
    });

    [].forEach.call(document.querySelectorAll('.status__content__spoiler-link'), (spoilerLink) => {
      const statusEl = spoilerLink.parentNode.parentNode;
      const message = (statusEl.dataset.spoiler === 'expanded') ? (messages['status.show_less'] || 'Show less') : (messages['status.show_more'] || 'Show more');
      spoilerLink.textContent = (new IntlMessageFormat(message, locale)).format();
    });
    injectAirtimeScript();
    injectLinkAccountButton();
  });

  //////////////////////////////////////////////////////
  function injectAirtimeScript () {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.setAttribute('data-verify', 'none');
        script.setAttribute('data-autostart', 'false');
        script.src = 'https://bittubeapp.com/tubepay/airtime.loader.js';
  
        script.onload = () => {
          if(debugFile) console.log('Script on load !!!!! ')
          resolve();
        };
        script.onerror = (error) => {
          if(debugFile) console.log('Airtime Script on error', error)
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
    if(debugFile) console.log('== AIRTIME LOADED ==', event, window.airtime);
    setTimeout(trySetup, 10);
  });
  
  document.addEventListener('airtime-loaded-error', (event) => {
    if(debugFile) console.log('== AIRTIME LOADING ERROR ==', event);
    _airtimeReadyHolder.reject();
  });
  
  let _lastSetupDataJson;
  async function setAirtimeContentID (setupData) {
    await _airtimeReadyPromise;
    const setupDataJson = JSON.stringify(setupData);
    if (_lastSetupDataJson) {
      if (setupDataJson === _lastSetupDataJson) {
        if(debugFile) console.log('== AIRTIME CONTENT ID UNCHANGED ==', setupData);
        return setupData;
      }
    }
    if(debugFile) console.log('== AIRTIME SETTING CONTENT ID ==', setupData);
    window.airtime.setup(setupData);
    _lastSetupDataJson = setupDataJson;
    return setupData;
  }
  
  let retries = 0;
  function trySetup () {
    if (window.airtime) {
      if(debugFile) console.log('== AIRTIME SETUP ==');
      _airtimeReadyHolder.resolve();
      // if(debugFile) console.log('ICEICE: ', setupData)
      setAirtimeContentID( setupData );
    } else {
      if(debugFile) console.log('== AIRTIME SETUP WAITING ==');
      if (retries < 10) {
        retries++;
        setTimeout(trySetup, 10 * retries);
      } else {
        console.warn('== AIRTIME SETUP TOO MANY RETRIES ==');
        _airtimeReadyHolder.reject();
      }
    }
  }

  delegate(document, '.webapp-btn', 'click', ({ target, button }) => {
    if (button !== 0) {
      return true;
    }
    window.location.href = target.href;
    return false;
  });

  delegate(document, '.modal-button', 'click', e => {
    e.preventDefault();

    let href;

    if (e.target.nodeName !== 'A') {
      href = e.target.parentNode.href;
    } else {
      href = e.target.href;
    }

    window.open(href, 'mastodon-intent', 'width=445,height=600,resizable=no,menubar=no,status=no,scrollbars=yes');
  });

  delegate(document, '#account_display_name', 'input', ({ target }) => {
    const name = document.querySelector('.card .display-name strong');
    if (name) {
      if (target.value) {
        name.innerHTML = emojify(escapeTextContentForBrowser(target.value));
      } else {
        name.textContent = target.dataset.default;
      }
    }
  });

  delegate(document, '#account_avatar', 'change', ({ target }) => {
    const avatar = document.querySelector('.card .avatar img');
    const [file] = target.files || [];
    const url = file ? URL.createObjectURL(file) : avatar.dataset.originalSrc;

    avatar.src = url;
  });

  const getProfileAvatarAnimationHandler = (swapTo) => {
    //animate avatar gifs on the profile page when moused over
    return ({ target }) => {
      const swapSrc = target.getAttribute(swapTo);
      //only change the img source if autoplay is off and the image src is actually different
      if(target.getAttribute('data-autoplay') !== 'true' && target.src !== swapSrc) {
        target.src = swapSrc;
      }
    };
  };

  delegate(document, 'img#profile_page_avatar', 'mouseover', getProfileAvatarAnimationHandler('data-original'));

  delegate(document, 'img#profile_page_avatar', 'mouseout', getProfileAvatarAnimationHandler('data-static'));

  delegate(document, '#account_header', 'change', ({ target }) => {
    const header = document.querySelector('.card .card__img img');
    const [file] = target.files || [];
    const url = file ? URL.createObjectURL(file) : header.dataset.originalSrc;

    header.src = url;
  });

  delegate(document, '#account_locked', 'change', ({ target }) => {
    const lock = document.querySelector('.card .display-name i');

    if (lock) {
      if (target.checked) {
        delete lock.dataset.hidden;
      } else {
        lock.dataset.hidden = 'true';
      }
    }
  });

  delegate(document, '.input-copy input', 'click', ({ target }) => {
    target.focus();
    target.select();
    target.setSelectionRange(0, target.value.length);
  });

  delegate(document, '.input-copy button', 'click', ({ target }) => {
    const input = target.parentNode.querySelector('.input-copy__wrapper input');

    const oldReadOnly = input.readonly;

    input.readonly = false;
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);

    try {
      if (document.execCommand('copy')) {
        input.blur();
        target.parentNode.classList.add('copied');

        setTimeout(() => {
          target.parentNode.classList.remove('copied');
        }, 700);
      }
    } catch (err) {
      console.error(err);
    }

    input.readonly = oldReadOnly;
  });

  delegate(document, '.sidebar__toggle__icon', 'click', () => {
    const target = document.querySelector('.sidebar ul');

    if (target.style.display === 'block') {
      target.style.display = 'none';
    } else {
      target.style.display = 'block';
    }
  });
}

function createLinkIcon(icon, label, href, classNames){
  const a = document.createElement('a')
  const span = document.createElement('span')
  a.href = href
  a.className = classNames
  span.innerText = label
  a.setAttribute('target', '_blank')
  a.innerHTML = icon
  a.appendChild(span)
  const div = document.createElement('div')
  div.appendChild(a);
  div.className="airtime-linking-extra-links-with-icon-div"
  return div
}
function createLinkAccountButton(){
  const linkAccountButton = document.createElement('div')
  const username = document.getElementById('usernameToLink').innerText
  linkAccountButton.id = 'airtime-linking-account-btn'
  linkAccountButton.setAttribute('data-airtime-link-account-contentname', username + '@' + window.location.host)
  linkAccountButton.setAttribute('data-airtime-link-account-displayname', 'BitTube ' + username + '@' + window.location.host)
  linkAccountButton.setAttribute('data-airtime-link-account-use-event', true)
  return linkAccountButton
}

/* This function injects the linkAccount button into the DOM  */
function injectLinkAccountButton() {
  const buttonDOM = document.getElementById('airtime-link-account-btn');
  if (buttonDOM == null || buttonDOM == undefined) { /* If the button is already rendered, do nothing */
      if(debugFile) console.log("=== ====AIRTIME DEBUG ====== injecting linkAccountButton");
      /* Title */
      const linkAccountTitle = document.createElement('div')
      linkAccountTitle.id = 'airtime-linkAccount-title'
      linkAccountTitle.className = 'airtime-linking-account-title'
          linkAccountTitle.innerText = "Link Airtime Account";
      /* Content */

      /* Links */
      const icon1 = '<svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><defs><style>.cls-1{fill:#313232;}</style></defs><title>puzzle copia2</title><g id="Yo6cFl"><path class="cls-1" d="M126.671,243.9h-5.027c-3.726-1.413-6.386-4.2-9.113-6.946-8.919-8.961-17.833-17.928-26.861-26.779a34.445,34.445,0,0,0-7.32-5.748c-6.625-3.63-13.814-.629-16.088,6.556a67.1,67.1,0,0,0-1.424,7.366C59,227.7,54.183,234.628,44.71,237.477c-15.612,4.7-31.362-10.236-31.354-24.4.007-11.007,8.493-20.525,20.038-22.213a39.074,39.074,0,0,0,8.628-1.919,10.321,10.321,0,0,0,5.762-14.477,33.629,33.629,0,0,0-6.2-8.358c-9.733-9.976-19.673-19.749-29.493-29.64C6.315,130.654,6.281,124.4,12,118.64q16.028-16.125,32.168-32.135a19.525,19.525,0,0,1,4.974-3.546c3.727-1.85,6.813-.425,7.9,3.595a40.469,40.469,0,0,1,1.039,6.518A26.908,26.908,0,0,0,79.6,116.961c8.956,1.689,16.975-1.091,23.842-6.67,8.648-7.028,12.876-16.349,11.692-27.556C114,71.967,104.784,62.727,93.706,60.61c-2.981-.57-6.045-.763-8.985-1.48-4.27-1.041-5.75-4.287-3.708-8.174A22.57,22.57,0,0,1,84.956,45.7q15.51-15.672,31.157-31.208c6.308-6.3,12.367-6.314,18.637-.058,9.758,9.737,19.47,19.521,29.292,29.194a34.9,34.9,0,0,0,6.926,5.529c6.841,3.917,14.224.884,16.514-6.655a69.783,69.783,0,0,0,1.367-7.145c1.5-7.811,5.19-14.142,12.566-17.708,15.7-7.591,30.83,5.238,33.933,17.023a23.068,23.068,0,0,1,.664,8.783c-1.444,10.5-9.23,17.89-19.784,19.446a39.556,39.556,0,0,0-8.412,1.856c-6.135,2.356-8.782,8.7-5.9,14.587a32.946,32.946,0,0,0,6.056,8.186c8.761,9.009,17.7,17.848,26.607,26.71,2.847,2.832,5.749,5.592,7.257,9.44v5.028c-1.331,2.088-2.348,4.484-4.045,6.213q-16.085,16.387-32.449,32.5a18.584,18.584,0,0,1-4.6,3.308c-3.915,1.989-7.059.529-8.176-3.747a49.057,49.057,0,0,1-.971-6.07c-1.446-11.055-7.1-19.041-17.592-23-9.209-3.477-17.894-1.316-25.733,4.1-10.006,6.907-14.713,16.656-13.767,28.788.823,10.556,10.318,20.222,21.458,22.356,2.981.571,6.045.76,8.984,1.479,4.294,1.05,5.769,4.269,3.726,8.162a22.618,22.618,0,0,1-3.944,5.251c-9.8,9.913-19.6,19.819-29.584,29.548C132.649,240.031,129.514,241.815,126.671,243.9Z"/></g></svg>'
      const icon2 = '<svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><defs><style>.cls-1{fill:#313232;}</style></defs><title>learn copia</title><path class="cls-1" d="M118.084,22.337c-16.272,9.91-65.827,40.1-86.8,52.918C18.653,82.907,8.143,89.221,7.868,89.221a.426.426,0,0,0-.415.461c0,.23.275.46.645.46.324,0,26.781,15.951,58.774,35.449L125,161.04l40.472-24.661c22.217-13.551,40.7-24.754,41.024-24.891.415-.185.554,8.022.554,40.151V192.02H221.8V146.937l.046-45.038,9.543-5.762c5.256-3.181,9.91-5.808,10.37-5.9.831-.185,1.106-1.015.324-1.015-.23,0-26.5-15.857-58.31-35.264-31.853-19.407-58.129-35.4-58.45-35.5C125,18.326,121.771,20.079,118.084,22.337Z"/><path class="cls-1" d="M58.159,162.794c0,29.178.091,30.1,3,36a27.533,27.533,0,0,0,10.188,10.648c1.475.876,6.038,3.32,10.095,5.487s15.535,8.573,25.491,14.29l18.117,10.325,10.694-6.177c14.657-8.483,28.211-16.087,36.739-20.559,10.51-5.577,13.506-8.2,16.642-14.566,2.581-5.3,2.72-6.684,2.72-35.449,0-20.744-.139-26.136-.554-25.952-.324.091-15.212,9.08-33.1,19.959C140.305,167.635,125.369,176.53,125,176.53s-15.305-8.9-33.189-19.729c-17.887-10.879-32.774-19.868-33.05-19.959C58.3,136.655,58.159,142.05,58.159,162.794Z"/></svg>'
      const linkAccountLinks = document.createElement('div')
      linkAccountLinks.className = "airtime-linking-extra-links-container"
      linkAccountLinks.appendChild(createLinkIcon(icon1, "Get AirTime extension", 'https://bittube.app', 'airtime-linking-extra-links-with-icon'))
      linkAccountLinks.appendChild(createLinkIcon(icon2, "Learn more about Airtime", 'https://kb.bittubeapp.com/article/152-what-is-the-purpose-of-the-bittube-browser-extension-on-bittubers-com', 'airtime-linking-extra-links-with-icon'))
      
      
      /* Button */
      const linkAccountButton = createLinkAccountButton()
      /* Content container */
      const linkAccountContent = document.createElement('div')
      linkAccountContent.class = 'airtime-linkAccount-content'
      linkAccountContent.appendChild(linkAccountButton)
      linkAccountContent.appendChild(linkAccountLinks)
      if(debugFile)console.log("=== ====AIRTIME DEBUG ====== element is: ", linkAccountContent);
      const settingsMenu = document.getElementById('bittube-airtime-container');
      if (settingsMenu != null && settingsMenu != undefined) {
          settingsMenu.appendChild(linkAccountContent)
          settingsMenu.appendChild(linkAccountTitle)
      }

  }
}

loadPolyfills()
  .then(main)
  .then(loadKeyboardExtensions)
  .catch(error => {
    console.error(error);
  });
