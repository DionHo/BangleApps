
const adhan = require('adhan.espruino.js');
var today = new Date(Date.now());
var latitude = parseFloat("52.2647");
var longitude = parseFloat("10.5237");

const coordinates = adhan.Coordinates(latitude, longitude);
const params = adhan.CalculationMethod.NorthAmerica();
var prayerTimes = new adhan.PrayerTimes(coordinates, today, params);

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
  "Isha": {value:timestr(prayerTimes.isha)}
};

console.log(menu);
E.showMenu(menu);