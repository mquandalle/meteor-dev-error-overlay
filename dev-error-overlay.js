// The overlay DOM element
let overlay = null;
// The HTML5 notification object
let notification = null;
// The content of the overlay iframe
let errorPage = null;

const loadedConfig = loadConfig();
const soundURL = '/packages/simple_dev-error-overlay/assets/pup_alert.mp3';
const alertSound = new Audio(soundURL);

// Poll the server for error
setInterval(checkErrorState, 500);

// In development mode a DDP/Websocket disconnection is likely a sign of a
// broken server. In this case we re-check the error state immediately instead
// of waiting on average 250ms (worst case 500ms).
Tracker.autorun(() => {
  if (! Meteor.status().connected) {
    checkErrorState();
  }
});

function checkErrorState() {
  HTTP.get('/', (err, res) => {
    // In case of a server disconnection we refresh the overlay but don't run
    // the alert -- to avoid ringing the alert every 500ms.
    if (err) {
      if (!overlay) {
        startErrorReport();
      } else {
        refreshErrorReport();
      }
      return;
    }

    const isMeteorApp = res.content.indexOf('__meteor_runtime_config__') !== -1;

    if (!overlay && !isMeteorApp) {
      startErrorReport();
      runAlerts();
    } else if (overlay && !isMeteorApp && errorPage !== res.content) {
      refreshErrorReport();
      runAlerts();
    } else if (overlay && isMeteorApp) {
      stopErrorReport();
    }
    errorPage = res.content;
  });
}

function startErrorReport() {
  overlay = document.createElement('div');
  overlay.className = 'simple-dev-error-overlay';

  // Templating! woo. reduce dependencies by not using React, Blaze, or Angular
  overlay.innerHTML = `
    <div class="simple-dev-error-window">
      <div class="simple-dev-error-controls">
        <strong>simple:dev-error-overlay</strong>
        &nbsp;|&nbsp;
        <label>
          <input type="checkbox" id="simple-dev-error-play-sound" data-config="playSound" />
          Play sound
        </label>
        &nbsp;
        <label>
          <input type="checkbox" id="simple-dev-error-show-notif" data-config="showNotif" />
          Show notification
        </label>
        &nbsp;|&nbsp;
        Settings stored in localStorage.
      </div>
      <div class="simple-dev-error-iframe-wrapper">
        <iframe src="/" id="simple-dev-error-iframe"></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const playSoundCheckbox = document.getElementById('simple-dev-error-play-sound');
  const showNotifCheckbox = document.getElementById('simple-dev-error-show-notif');

  [playSoundCheckbox, showNotifCheckbox].forEach((checkbox) => {
    const configKey = checkbox.dataset.config;

    if (loadedConfig[configKey]) {
      checkbox.checked = true;
    }

    checkbox.onchange = () => {
      // Edit the config
      loadedConfig[configKey] = checkbox.checked;
      setConfig(loadedConfig);

      // If the sound notification was activated, play the sound as a discovery
      // mechanism.
      if (configKey === 'playSound' && checkbox.checked) {
        alertSound.play();
      }
    }
  });
}

// If we are already reporting an error in the overlay, and we have detected
// a new error on the server, we need refresh the iframe.
function refreshErrorReport() {
  const iframe = document.getElementById('simple-dev-error-iframe');;
  iframe.src = iframe.src;
}

function stopErrorReport() {
  if (overlay) {
    document.body.removeChild(overlay);
    overlay = null;
    errorPage = null;
    Meteor.reconnect();
  }

  if (notification) {
    notification.close();
    notification = null;
  }
}

function runAlerts() {
  if (loadedConfig.showNotif) {
    notifyError('Build error in your app!');
  }

  if (loadedConfig.playSound) {
    alertSound.play();
  }
}

// Mostly lifted from https://developer.mozilla.org/en-US/docs/Web/API/notification
function notifyError(message) {
  if (notification) {
    // Already displaying a notification
    return;
  }

  const options = {
    body: 'From simple:dev-error-overlay',

    // Prevents notification from showing twice for the same app if you have multiple tabs open
    tag: window.location.host + 'simple:dev-error-overlay'
  };

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    notification = new Notification(message, options);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        notification = new Notification(message, options);
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
