var fs = require('fs');
var path = require('path');
var airSdk = require('./lib/air');
var request = require('request');
var playerGlobal = require('playerglobal-latest');
var packageMetadata = require('./package.json');
var shell = require('shelljs');
var downloadUrl = packageMetadata.airSdk[process.platform];
var libFolder = 'lib/AIR_SDK';
var frameworksDir = path.join(__dirname, libFolder);
var pathFlexFrameworksSWC = path.join(__dirname, libFolder, 'frameworks/libs/');
var progress = require('request-progress');
var AdmZip = require('adm-zip');


var name;
switch(process.platform){
  case 'darwin' : 
    name = 'AIRSDK_Compiler.tbz2';
    break;
  case 'win32' :
    name = 'AIRSDK_Compiler.zip';
    break;
}

var tmpLocation = path.join(__dirname, 'lib', name);


fs.stat(libFolder, function(err, stats) {
  if(!err) {
      console.log("AIR SDK was already downloaded");
      process.exit(0);
  }

  console.log("Downloading Adobe AIR SDK, please wait....");
    
  progress(request('https://az412801.vo.msecnd.net/vhd/VMBuild_20141027/VirtualBox/IE11/Windows/IE11.Win8.1.For.Windows.VirtualBox.zip'), {
    // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
    // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
    // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
  })
  .on('progress', function (state) {
      // The state is an object that looks like this:
      // {
      //     percent: 0.5,               // Overall percent (between 0 to 1)
      //     speed: 554732,              // The download speed in bytes/sec
      //     size: {
      //         total: 90044871,        // The total payload size in bytes
      //         transferred: 27610959   // The transferred payload size in bytes
      //     },
      //     time: {
      //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
      //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
      //     }
      // }
      process.stdout.write('Downloading progress: ' + Math.round(state.percent * 100) + "% \r");
  })
  .on('error', function (err) {
      console.error("Could not download AIR SDK!");
      process.exit(1);
  })
  .on('end', function () {
    // Do something after request finishes
    console.log("AIR SDK download complete!");     
    handleDownload();
  })
  .pipe(fs.createWriteStream(tmpLocation));
  
//
//  process.on('uncaughtException', function(err) {
//    console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
//    console.error(err.stack)
//    process.exit(1);
//  });
});

function handleDownload() {
  
    shell.mkdir(libFolder);
    console.log("Preparing to extract file...");
    
    switch(process.platform){
      case 'darwin' : 
        shell.exec('tar -xjf ' + tmpLocation + ' -C ' + libFolder);
        break;
      case 'win32' :
        AdmZip(tmpLocation).extractAllTo(libFolder, true);
        break;
    }
  
    console.log("File extracted...");
    shell.rm(tmpLocation);
    console.log("Installing all playerglobal frameworks...");
    airSdk.update();
  
    playerGlobal.install(frameworksDir, function(err) {
      if (err) {
        console.error('Failed to install the latest "playerglobal.swc" library collection!', err);
      } else {
        console.log('Successfully installed the latest "playerglobal.swc" library collection.');
      }
      shell.cp("extra/framework.swc", pathFlexFrameworksSWC);
      process.exit(err ? 1 : 0);
    });
}