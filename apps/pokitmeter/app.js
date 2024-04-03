const statusservice_pokitmeter   = "57d3a771-267c-4394-8872-78223e92aec4";
const statusservice_pokitpro     = "57d3a771-267c-4394-8872-78223e92aec5";
const mmservice_uuid             = "e7481d2f-5781-442e-bb9a-fd4e3441dadc";
const mmservice_setmode_uuid     = "53dc9a7a-bc19-4280-b76b-002d0e23b078";
const mmservice_measurement_uuid = "047d3559-8bee-423a-b229-4417fa603b90";

var MMModeTitle = {
  0:"IDLE",
  1:"DC Voltage", 5:"Resistance",
  2:"AC Voltage", 6:"Diode",
  3:"DC Current", 7:"Continuity",
  4:"AC Current", 8:"Temperature"
};

var MMModeUnit = {
  0:"[]",
  1:"V", 5:"Ohm",
  2:"V", 6:"",
  3:"A", 7:"",
  4:"A", 8:"°C"
};

var DigitsForMode = {
  0: 0,
  1: 3, 5: 0,
  2: 3, 6: 2,
  3: 3, 7: 2,
  4: 3, 8: 2
};

var ThemeColor = {
  fg: g.theme.fg,
  bg: g.theme.bg,
  fg2: g.theme.fg2,
  bg2: g.theme.bg2,
};

var gatt;
var mmservice;
var statusservice_uuid;
var display_mode = "measure";


function showDeviceMenu() {
  display_mode = "device_menu";
  if(gatt != null){
    gatt.disconnect();
  }
  menu = {
    "": { "title": "Connect Device" },
    "< Back": () => {
      if(mmservice != null) {setMMMode(0).then((response) => load());}
      else {load();}
    },
    "Connect Pokit Meter": () => {
      statusservice_uuid = statusservice_pokitmeter;
      E.showMenu();
      E.showMessage("Scanning for Pokit ...");
      connection_setup();
    },
    "Connect Pokit Pro": () => {
      statusservice_uuid = statusservice_pokitpro;
      E.showMenu();
      E.showMessage("Scanning for Pokit ...");
      connection_setup();
    }
  };
  g.reset().clearRect(Bangle.appRect);
  E.showMenu(menu);
}

function showModeMenu() {
  display_mode = "menu";
  menu = {
    "": { "title": "Mode Select" },
  };
  Object.keys(MMModeTitle).forEach((mode)=>{
    menu[MMModeTitle[mode]] = () => {
      E.showMenu();
      setMMMode(mode);
      showMesurements();
    };
  });
  menu["< Back"] =  () => setMMMode(0).then((response) => load());
  setMMMode(0).then(function(response){
    g.reset().clearRect(Bangle.appRect);
    E.showMenu(menu);
  });
}

function showMesurements() {
  display_mode = "measure";
  Bangle.setUI({
    mode : "custom",
    back : function() {
      setMMMode(0).then((response) => load());
    },
    swipe : (LR,_) => {
      if (LR == 1) { // swipe right
        showModeMenu();
      }
    }
  });
}

function decodeMMAndShow(d) {
  if(display_mode == "measure"){
//    var status = d.getUint8(0);
    var value = d.getFloat32(1,true);
    var mode = d.getUint8(5);
    var value_str = value.toFixed(DigitsForMode[mode]);

    // Continuity 'special effects'
    if(mode==7){
      if(value<1000.0){
        VIBRATE.write(1);
        g.setTheme({bg:ThemeColor.fg,
                    fg:ThemeColor.bg,});
      } else {
        VIBRATE.write(0);
        g.setTheme({bg:ThemeColor.bg,
                    fg:ThemeColor.fg,});
      }
    }
    
    var R = Bangle.appRect;
    g.reset().clearRect(R);
    g.setFont("12x20").setFontAlign(-1,-1).drawString(MMModeTitle[mode], R.x, R.y);
    g.setFont("12x20").setFontAlign(1,1).drawString(MMModeUnit[mode], R.x+R.w-1, R.y+R.h-1);
    var fontSize = 80;
    g.setFont("Vector",fontSize).setFontAlign(0,0);
    while (g.stringWidth(value_str) > R.w-20) {
      fontSize -= 2;
      g.setFont("Vector", fontSize);
    }
    g.drawString(value_str, R.x+R.w/2, R.y+R.h/2);
  }
}

function setMMMode(mode) {
  return mmservice.getCharacteristic(mmservice_setmode_uuid).then(function(characteristic) {
    E.showMessage("Set to MultiMeter mode to \n'"+MMModeTitle[mode]+"'");
    console.log("Set to MultiMeter mode to '"+MMModeTitle[mode]+"'");
    var b = new ArrayBuffer(6);
    var v = new DataView(b);
    v.setUint8(0,mode);      // Set mesurement mode
    v.setUint8(1,255);       // Set range to "autorange" (=255)
    v.setUint32(2,100, true);// Set update interval to 100ms
    return characteristic.writeValue(b);
  });
}

function connection_setup() {
  E.showMessage("Scanning for Pokit Meter...");
  NRF.requestDevice({ filters: [{timeout: 20000, services:[statusservice_uuid]}]}).then(function(d) {
    device = d;
    E.showMessage("Found pokit [1/6]");
    console.log("Initialize pokit ...");
    return device.gatt.connect();
  }).then(function(ga) {
    gatt = ga;
    E.showMessage("Connected [2/6]");
    return gatt.getPrimaryService(mmservice_uuid);
  }).then(function(service) {
    E.showMessage("Got primary service [3/6]");
    mmservice = service;
    return setMMMode(1);
  }).then(function (response){
    return mmservice.getCharacteristic(mmservice_measurement_uuid);
  }).then(function(c) {
    E.showMessage("register measurement notifier [5/6]");
    c.on('characteristicvaluechanged', function(event) {
      var d = event.target.value;
      decodeMMAndShow(d);
    });
    return c.startNotifications();
  }).then(function() {
    return mmservice.getCharacteristic(mmservice_measurement_uuid);
  }).then(function(c) {
    E.showMessage("read first measurement value [6/6]");
    return c.readValue();
  }).then(function(d) {
    decodeMMAndShow(d);
    showMesurements();
  }).then(function (){
    console.log("Done!");
  }).catch(function(e) {
    E.showMessage(e.toString(), "ERROR");
    console.log(e);
    setTimeout(connection_setup, 1000);
  });
}

Bangle.loadWidgets();
Bangle.drawWidgets();
E.showMessage(/*LANG*/"Connecting...");
showDeviceMenu();

E.on('kill',()=>{
  if (gatt!=undefined) gatt.disconnect();
  console.log("Disconnected pokit!");
});
NRF.on('disconnect', connection_setup); // restart if disconnected
