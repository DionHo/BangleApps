const SETTINGS_FILE = "prayertimes.settings.json";
let settings;
function loadSettings() {
  settings = require("Storage").readJSON(SETTINGS_FILE,true)||{};
}
loadSettings();


const adhan = require('adhan.espruino.js');
var today = new Date(Date.now());

let coordinates = adhan.Coordinates(settings.latitude, settings.longitude);
let prayerTimes = new adhan.PrayerTimes(coordinates, today, settings.calcmethod);

function timestr(datetime){
  return datetime.getHours().toString().padStart(2,'0')+":"+datetime.getMinutes().toString().padStart(2,'0');
}

let menu = {
  "": { "title": "Prayer Times" },
  "< Back": () => load(),
  "Fajr": {value:timestr(prayerTimes.fajr)},
  "Sunrise": {value:timestr(prayerTimes.sunrise)},
  "Dhuhr": {value:timestr(prayerTimes.dhuhr)},
  "Asr": {value:timestr(prayerTimes.asr)},
  "Maghrib": {value:timestr(prayerTimes.maghrib)},
  "Isha": {value:timestr(prayerTimes.isha)},
  "Settings": () => eval(require("Storage").read("prayertimes.settings.js"))(()=>{loadSettings();menuMain();})
};

console.log(menu);
E.showMenu(menu);
