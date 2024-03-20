function setAdhanTimers(prayer, diff_ms){
  // Set the timer to go off on prayer time
  require("sched").setAlarm("prayertimer-adhan", {
    msg: "Its time to pray: " + prayer.charAt(0).toUpperCase() + prayer.slice(1),
    timer: diff_ms,
    on: true,
    hidden: true,
    vibrate: "; : ;",
    del: true
  });
  // Set another timer to 15min after the prayer time, loading this file to schedule the next prayer time
  require("sched").setAlarm("prayertimer", {
    timer: diff_ms + 900000,
    js: "eval(require('Storage').read('prayertimes.boot.js'))",
    on: true,
    hidden: true,
    del: true
  });
  console.log("Next Prayer is "+prayer+". Timer goes off in "+(diff_ms/3600000).toFixed(2)+" hours.");
}


(function() {
  let settings = Object.assign({
    latitude: parseFloat("52.2647"),
    longitude: parseFloat("10.5237"),
    calcmethod: "NorthAmerica",
    adhan: false
  }, require('Storage').readJSON("prayertimes.settings.json", true) || {});
  console.log("prayertimes.boot.js");
  let sched = require("sched");
  let prayertimer_adhan_undefined = sched.getTimeToAlarm(sched.getAlarm("prayertimer-adhan")) == undefined;
  console.log(settings);
  if(settings.adhan) {
    console.log("Adhan enabled.");
    if(prayertimer_adhan_undefined){
      console.log("Adhan enabled and timers not available ... setup timers!");
      const adhan = require('adhan.espruino.js');
      let now = new Date(Date.now());
      let coordinates = adhan.Coordinates(settings.latitude, settings.longitude);
      let prayerTimes = new adhan.PrayerTimes(coordinates, now, adhan.CalculationMethod[settings.calcmethod]());
      let done = false;
      for(const prayer of ["fajr","dhuhr","asr","maghrib","isha"]){
        if(prayerTimes[prayer].valueOf() > now.valueOf()){
          console.log("Next Prayer: "+prayer);
          let diff_ms = Math.abs(prayerTimes[prayer].valueOf() - now.valueOf());
          setAdhanTimers(prayer, diff_ms);
          done = true;
          break;
        }
      }
      if(!done){
        console.log("Next Prayer: Fajr ... tomorrow!");
        prayerTimes = new adhan.PrayerTimes(coordinates, new Date(now.valueOf()+24*60*60*1000), adhan.CalculationMethod[settings.calcmethod]());
        let diff_ms = Math.abs(prayerTimes["fajr"].valueOf() - now.valueOf());
        setAdhanTimers("fajr", diff_ms);
      }
      delete prayerTimes;
      delete adhan;
    }
  } else {
    console.log("Adhan disabled.");
    if(!prayertimer_undefined){
      console.log("Adhan timers active ... deactivate adhan timers.");
      sched.setAlarm("prayertimer", undefined);
      sched.setAlarm("prayertimer-adhan", undefined);
    }
  }
  require("sched").reload();
})();
