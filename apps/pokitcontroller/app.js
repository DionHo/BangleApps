var decoded;
var gatt;
var mmservice;

function decode(d) {
  var status = d.getUint8(0);
  var value = d.getFloat32(1,true);
  var mode = d.getUint8(5);
  updateDisplay(value);
}

function updateDisplay(value) {
  var s = value.toFixed(5);

  var R = Bangle.appRect;
  g.reset().clearRect(R);
  g.setFont("12x20").setFontAlign(-1,-1).drawString("voltage", R.x, R.y);
  g.setFont("12x20").setFontAlign(1,1).drawString("V", R.x+R.w-1, R.y+R.h-1);
  var fontSize = 80;
  g.setFont("Vector",fontSize).setFontAlign(0,0);
  while (g.stringWidth(s) > R.w-20) {
    fontSize -= 2;
    g.setFont("Vector", fontSize);
  }
  g.drawString(s, R.x+R.w/2, R.y+R.h/2);
}

Bangle.loadWidgets();
Bangle.drawWidgets();
E.showMessage(/*LANG*/"Connecting...");

function connection_setup() {
  E.showMessage("Scanning for Pokit Meter...");
  NRF.requestDevice({ filters: [{timeout: 20000, services:["57d3a771-267c-4394-8872-78223e92aec4"]}]}).then(function(d) {
    device = d;
    E.showMessage("Found pokit [1/6]");
    console.log("Initialize pokit ...");
    return device.gatt.connect();
  }).then(function(ga) {
    gatt = ga;
    E.showMessage("Connected [2/6]");
    return gatt.getPrimaryService("e7481d2f-5781-442e-bb9a-fd4e3441dadc");
  }).then(function(service) {
    E.showMessage("Got primary service [3/6]");
    mmservice = service;
    return mmservice.getCharacteristic("53dc9a7a-bc19-4280-b76b-002d0e23b078");
  }).then(function(characteristic) {
    E.showMessage("Set to voltage measurement [4/6]");
    var b = new ArrayBuffer(6);
    var v = new DataView(b);
    v.setUint8(0,1);    // Set mesurement mode to voltage (=1) 
    v.setUint8(1,255);  // Set range to "autorange" (=255)
    v.setUint32(2,100, true);// Set update interval to 100ms
    return characteristic.writeValue(b);
  }).then(function (response){
    return mmservice.getCharacteristic("047d3559-8bee-423a-b229-4417fa603b90");
  }).then(function(c) {
    E.showMessage("register change-value notifier [5/6]");
    c.on('characteristicvaluechanged', function(event) {
      var d = event.target.value;
      decode(d);
    });
    return c.startNotifications();
  }).then(function() {
    return mmservice.getCharacteristic("047d3559-8bee-423a-b229-4417fa603b90");
  }).then(function(c) {
    E.showMessage("read first measurement value [6/6]");
    return c.readValue();
  }).then(function(d) {
    decode(d);
  }).then(function (){
    console.log("Done!");
  }).catch(function(e) {
    E.showMessage(e.toString(), "ERROR");
    console.log(e);
    setTimeout(connection_setup, 1000);
  });
}


connection_setup();
E.on('kill',()=>{
  if (gatt!=undefined) gatt.disconnect();
  console.log("Disconnected pokit!");
});
NRF.on('disconnect', connection_setup); // restart if disconnected

