const errorState = new ReactiveVar(false);

let overlay = null;

const loadedConfig = loadConfig();

// Poll the server for error
setInterval(checkErrorState, 500);

Tracker.autorun(() => {
  const isErrorState = errorState.get();

  if (isErrorState) {
    alertError();
  } else {
    hideError();
  }
});

function checkErrorState() {
  HTTP.get('/', (err, res) => {
    if (err) {
      // Clearly something is wrong if we can't even reach the server?
      errorState.set(true);
      return;
    }

    const isMeteorApp = res.content.indexOf('__meteor_runtime_config__') !== -1;

    if (! isMeteorApp) {
      errorState.set(true);
    } else {
      errorState.set(false);
      Meteor.reconnect();
    }
  });
}

function alertError() {
  if (overlay) {
    // We are already in the error state, since the error overlay is already on the screen.
    return;
  }

  if (loadedConfig.showNotif) {
    notifyError('Build error in your app!');
  }

  overlay = document.createElement('div');
  overlay.className = 'simple-dev-error-overlay';

  // We play a honking sound from an embedded YouTube video. I'd love to accept a PR to do this in
  // a much better way!
  let maybeSound = '';
  if (loadedConfig.playSound) {
    maybeSound = `<iframe
      width="0"
      height="0"
      src="https://www.youtube.com/embed/2V753xY96Yg?autoplay=1"
      frameborder="0"
    ></iframe>`;
  }

  // Templating! woo. reduce dependencies by not using React, Blaze, or Angular
  overlay.innerHTML = `
    <div class="simple-dev-error-window">
      <div class="simple-dev-error-controls">
        <strong>simple:dev-error-overlay</strong>
        &nbsp;|&nbsp;
        <input type="checkbox" id="simple-dev-error-play-sound" data-config="playSound">
          <label>Play sound</label>
        </input>
        &nbsp;
        <input type="checkbox" id="simple-dev-error-show-notif" data-config="showNotif">
          <label>Show notification</label>
        </input>
        &nbsp;|&nbsp;
        Settings stored in localStorage.
      </div>
      ${maybeSound}
      <iframe src="/"></iframe>
    </div>
  `

  document.body.appendChild(overlay);

  const playSoundCheckbox = document.getElementById('simple-dev-error-play-sound');
  const showNotifCheckbox = document.getElementById('simple-dev-error-show-notif');

  [playSoundCheckbox, showNotifCheckbox].forEach((checkbox) => {
    const configKey = checkbox.dataset.config;

    if (loadedConfig[configKey]) {
      checkbox.checked = true;
    }

    checkbox.onchange = () => {
      loadedConfig[configKey] = checkbox.checked;
      setConfig(loadedConfig);
    }
  });
}

function hideError() {
  if (! overlay) { return; }
  document.body.removeChild(overlay);
  overlay = null;
}

// Mostly lifted from https://developer.mozilla.org/en-US/docs/Web/API/notification
function notifyError(message) {
  const options = {
    body: 'From simple:dev-error-overlay'
  };

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    const notification = new Notification(message, options);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        const notification = new Notification(message, options);
      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them any more.
}

function loadConfig() {
  let config = localStorage.simpleDevErrorOverlayConfig;

  if (! config) {
    config = {
      playSound: false,
      showNotif: false
    };
  } else {
    try {
      config = JSON.parse(config);
    } catch (e) {
      // Malformed JSON there, fix it!
      config = {
        playSound: false,
        showNotif: false
      };
      localStorage.simpleDevErrorOverlayConfig = JSON.stringify(config);
    }
  }

  return config;
}

function setConfig(config) {
  localStorage.simpleDevErrorOverlayConfig = JSON.stringify(config);
}
