import React from 'react';
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm"
import * as tf from '@tensorflow/tfjs-core';
import * as tfconv from '@tensorflow/tfjs-converter';

tfjsWasm.setWasmPaths(
    `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
        tfjsWasm.version_wasm}/dist/`);

const BASE_PATH = 'https://storage.googleapis.com/tfjs-models/savedmodel/';
const MODEL_NAME = 'ssdlite_mobilenet_v2';

class MobileNetSSD extends React.Component{
    constructor(props){
        super(props);
        this.model = null;
        this.modelWidth=300;
        this.modelHeight=300;
        this.channels = 3;
        this.batchSize = 1;

    }

    async setModelBackend(backend){
        await tf.setBackend(backend);
        await tf.ready();
    }

    async load() {
        this.model = await tfconv.loadGraphModel(`${BASE_PATH}${MODEL_NAME}/model.json`);
        const zeroTensor = tf.zeros([this.batchSize, this.modelHeight, this.modelWidth, this.channels], 'int32');
        const result = await this.model.executeAsync(zeroTensor);
        await Promise.all(result.map(t=>t.data()));
        const shape = result.map(t => t.shape);
        if(shape.length !==2 || shape[0].length !== 3 || shape[1].length !== 4){
            result.map(t => t.dispose());
            throw new Error(
                `Unexpected output shape from model: [${shape}]`);
        }
        result.map(t => t.dispose());
        zeroTensor.dispose();
        console.log("Model ready!");
    }
};

export default MobileNetSSD;