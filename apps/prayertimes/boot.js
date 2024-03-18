(function() {
  let settings = Object.assign({
    latitude: parseFloat("52.2647"),
    longitude: parseFloat("10.5237"),
    calcmethod: "NorthAmerica",
    adhan: false
  }, require('Storage').readJSON("prayertimes.settings.json", true) || {});
  console.log("prayertimes.boot.js");
  console.log(settings);
  if(settings.adhan){
    console.log("Setting adhan timers ...");
    const adhan = require('adhan.espruino.js');
    let now = new Date(Date.now());
    let coordinates = adhan.Coordinates(settings.latitude, settings.longitude);
    let prayerTimes = new adhan.PrayerTimes(coordinates, now, adhan.CalculationMethod[settings.calcmethod]());
    let done = false;
    for(const prayer in ["fajr","dhuhr","asr","maghrib","isha"]){
      console.log(prayerTimes[prayer]);
      console.log(prayerTimes[prayer].valueOf());
      console.log(now);
      console.log(now.valueOf());
      console.log(prayerTimes[prayer].valueOf() - now.valueOf());
      if(prayerTimes[prayer].valueOf() > now.valueOf()){
        let diff_ms = Math.abs(prayerTimes[prayer].valueOf() - now.valueOf());
        if(diff_ms > 900000){ // more than 15 minutes
          // recall this file 10 minutes before the alarm to make time adjustments
          require("sched").setAlarm("prayertimer", {
            timer: diff_ms - 600000,
            js: "eval(require('Storage').read('prayertimes.boot.js'))",
            del: true
          });
          console.log("Call for adhan calibration in "+((diff_ms - 600000)/3600000).toFixed(2)+" hours.");
        } else {
          require("sched").setAlarm("prayertimer", {
            timer: diff_ms + 120000, // set the prayertimer 2 minutes after adhan to initialize the next adhan
            js: "eval(require('Storage').read('prayertimes.boot.js'))",
            del: true
          });
          require("sched").setAlarm("prayertimer-adhan", {
            msg: "Its time to pray: " + prayer.charAt(0).toUpperCase() + prayer.slice(1),
            timer: diff_ms,
            del: true
          });
          console.log("Adhan in "+((diff_ms - 600000)/60000).toFixed(1)+" minutes!");
        }
        done = true;
        break;
      }
    }
    if(!done){
      console.log("Next Fajr ... to be implemented!");
    }
    delete adhan;
  } else {
    require("sched").setAlarm("prayertimer", undefined);
    require("sched").setAlarm("prayertimer-adhan", undefined);
    console.log("Deactivated adhan timers.");
  }
})();
