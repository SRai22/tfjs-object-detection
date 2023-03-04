# Object Detection in Real time 

* Clone the repo from https://github.com/SRai22/tfjs-object-detection.git <br/>

* cd tfjs-object-detection 

* npm install 

## Running with Wasm backend
```
    npm start 
```
* Opens the browser, allow the browser to access camera, click the button to start the detection.

## Running with WebGPU backend

* Download and Install Chrome Canary from https://www.google.com/chrome/canary/

* Open chrome, and goto: chrome://flags/ , enable  the option #enable-unsafe-webgpu

* Relaunch chrome 

* Goto tfjs-object-detection/src/components/ObjectDetection.js --> edit line
```
66           await detector.current.setModelBackend("wasm");

                        to 

66           await detector.current.setModelBackend("webgpu");
```
```
    npm start
```

* Open with Chrome Canary, allow the browser to access camera, click the button to start the detection.

## TODO
* Parameterize the backend variable
