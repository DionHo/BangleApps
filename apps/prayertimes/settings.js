(function(back) {
  const SETTINGS_FILE = "prayertimes.settings.json";
  const adhan = require('adhan.espruino.js');
  const APP_NAME = 'prayertimes';

  // initialize with default settings...
  const storage = require('Storage')
  let settings = Object.assign({
    latitude: parseFloat("52.2647"),
    longitude: parseFloat("10.5237"),
    calcmethod: "NorthAmerica",
    adhan: false
  }, require('Storage').readJSON(SETTINGS_FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(SETTINGS_FILE, settings);
  }

  var menu_main = {
    '': { 'title': 'PT Settings' },
    '< Back': back,
    'Update Location': {
      value: settings.latitude.toFixed(3)+"\n"+settings.longitude.toFixed(3),
      onchange: () => {
        E.showMessage("Get Location via GPS ...");
        Bangle.setGPSPower(true, APP_NAME);
        Bangle.on('GPS', fix => {
          if ('fix' in fix && fix.fix != 0 && fix.satellites >= 4) {
            Bangle.setGPSPower(false, APP_NAME);
            settings.latitude = fix.lat;
            settings.longitude = fix.lon;
            writeSettings();
            E.showMenu(menu_main);
          }
        });
      },
    },
    'Calc Method':{
      value: Object.keys(adhan.CalculationMethod).indexOf(settings.calcmethod),
      min: 0,
      max: Object.keys(adhan.CalculationMethod).length,
      format: v => Object.keys(adhan.CalculationMethod)[v],
      onchange: v => {
        settings.calcmethod = Object.keys(adhan.CalculationMethod)[v];
        writeSettings();
      }
    },
    'Adhan':{
      value: settings.adhan,
      onchange: v => {
        settings.adhan = v;
        eval(require('Storage').read('prayertimes.boot.js'));
        writeSettings();
      }
    }
  };

  Bangle.loadWidgets();
  Bangle.drawWidgets();
  E.showMenu(menu_main);
})
