(function(back) {
  const SETTINGS_FILE = "prayertimes.settings.json";
  const adhan = require('adhan.espruino.js');
  const APP_NAME = 'prayertimes';

  // initialize with default settings...
  const storage = require('Storage')
  let settings = Object.assign({
    latitude: parseFloat("52.2647"),
    longitude: parseFloat("10.5237"),
    calcmethod: adhan.CalculationMethod.NorthAmerica()
  }, require('Storage').readJSON(SETTINGS_FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(SETTINGS_FILE, settings);
  }

  var menu_main = {
    '': { 'title': 'PT Settings' },
    '< Back': back,
    'Update Location': {
      value: settings.latitude,
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
      value: settings.calcmethod,
      format: v => Object.keys(adhan.CalculationMethod)[v],
      onchange: v => {
        settings.calcmethod = adhan.CalculationMethod[v]();
        writeSettings();
      }
    }
  };

  // Submenu 'Calculation Method'
  // var menu_calcmethod = {
  //   "" : { title : "-- SubMenu --",
  //         back : function() { E.showMenu(menu_main); } },
  //   "MuslimWorldLeague" : () => { settings.calcmethod = adhan.CalculationMethod.MuslimWorldLeague(); writeSettings(); E.showMenu(menu_main);},
  //   "NorthAmerica" :      () => { settings.calcmethod = adhan.CalculationMethod.NorthAmerica(); writeSettings(); E.showMenu(menu_main);},
  //   "MoonsightingCommittee" : () => { settings.calcmethod = adhan.CalculationMethod.MoonsightingCommittee(); writeSettings(); E.showMenu(menu_main);},
  //   "UmmAlQura" :         () => { settings.calcmethod = adhan.CalculationMethod.UmmAlQura(); writeSettings(); E.showMenu(menu_main);},
  //   "Egyptian" :          () => { settings.calcmethod = adhan.CalculationMethod.Egyptian(); writeSettings(); E.showMenu(menu_main);},
  //   "Turkey" :            () => { settings.calcmethod = adhan.CalculationMethod.Turkey(); writeSettings(); E.showMenu(menu_main);},
  //   "Dubai" :             () => { settings.calcmethod = adhan.CalculationMethod.Dubai(); writeSettings(); E.showMenu(menu_main);},
  // };

  E.showMenu(menu_main);
})
