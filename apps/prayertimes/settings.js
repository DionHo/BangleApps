(function(back) {
  const SETTINGS_FILE = "prayertimes.settings.json";
  const adhan = require('adhan.espruino.js');
  const APP_NAME = 'prayertimes';

  // initialize with default settings...
  const storage = require('Storage')
  let settings = Object.assign({
    latitude: parseFloat("52.2647"),
    longitude: parseFloat("10.5237"),
    calcmethod: "NorthAmerica"
  }, require('Storage').readJSON(SETTINGS_FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(SETTINGS_FILE, settings);
  }

  var menu_main = {
    '': { 'title': 'PT Settings' },
    '< Back': back,
    'Update Location': {
      value: settings.latitude.toFixed(3)+"|"+settings.longitude.toFixed(3),
      onchange: () => {
        Bangle.setGPSPower(true, APP_NAME);
        Bangle.on('GPS', fix => {
          if ('fix' in fix && fix.fix != 0 && fix.satellites >= 4) {
            Bangle.setGPSPower(false, APP_NAME);
            settings.latitude = fix.lat;
            settings.longitude = fix.lon;
            writeSettings();
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
        console.log("Object.keys(adhan.CalculationMethod).length: "+Object.keys(adhan.CalculationMethod).length.toString());
        console.log(v);
        console.log(Object.keys(adhan.CalculationMethod)[v]);
        settings.calcmethod = Object.keys(adhan.CalculationMethod)[v];
        writeSettings();
      }
    }
  };

  E.showMenu(menu_main);
})
