const SETTINGS_FILE = "prayertimes.settings.json";
const adhan = require('adhan.espruino.js');

let settings;
function loadSettings() {
  settings = Object.assign({
    latitude: parseFloat("52.2647"),
    longitude: parseFloat("10.5237"),
    calcmethod: "NorthAmerica"
  }, require('Storage').readJSON(SETTINGS_FILE, true) || {});
}
loadSettings();


let today = new Date(Date.now());
let coordinates = adhan.Coordinates(settings.latitude, settings.longitude);
let prayerTimes = new adhan.PrayerTimes(coordinates, today, adhan.CalculationMethod[settings.calcmethod]());

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
  "Settings": () => eval(require("Storage").read("prayertimes.settings.js"))(()=>{loadSettings();E.showMenu(menu);})
};

console.log(menu);
E.showMenu(menu);
