import React from 'react';
import * as tfWebGpu from"@tensorflow/tfjs-backend-webgpu";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import * as tf from '@tensorflow/tfjs-core';
import * as tfconv from '@tensorflow/tfjs-converter';
import { CLASSES } from './classes';
import DetectedObject from './DetectedObject';

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
        if(backend === 'webgpu')
        {
            const adapter = await navigator.gpu.requestAdapter();
            const device = await adapter.requestDevice();
            console.log(device);
            tf.registerBackend(
                backend, async () =>{
                    return new tfWebGpu.WebGPUBackend(device);
                }
            );
        }
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

    getImageSize(input){
        if (input instanceof tf.Tensor) {
          return {height: input.shape[0], width: input.shape[1]};
        } else {
          return {height: input.height, width: input.width};
        }
    }

    toImageTensor(input){
        const imageTensor = tf.browser.fromPixels(input);
        return tf.image.resizeBilinear(imageTensor, [this.modelHeight, this.modelWidth]);
    }

    /**
    * Detect objects for an image returning a list of bounding boxes with
    * assocated class and score.
    *
    * @param img The image to detect objects from. Can be a tensor or a DOM
    *     element image, video, or canvas.
    * @param maxNumBoxes The maximum number of bounding boxes of detected
    * objects. There can be multiple objects of the same class, but at different
    * locations. Defaults to 20.
    * @param minScore The minimum score of the returned bounding boxes
    * of detected objects. Value between 0 and 1. Defaults to 0.5.
    */
    async detect(img,maxNumBoxes = 20, minScore = 0.5) {
        if (img == null) {
            this.reset();
            return [];
        }
        const imageTensor = img instanceof tf.Tensor ? img:this.toImageTensor(img);

        return this.infer(imageTensor, maxNumBoxes, minScore);
    };

    /**
     * Dispose the tensors allocated by the model. You should call this when you
     * are done with the model.
     */
    dispose() {
    if (this.model != null) {
        this.model.dispose();
        }
    };

    async infer(img, maxNumBoxes, minScore){
        const batched = tf.tidy(() => {
            if (!(img instanceof tf.Tensor)) {
              img = tf.browser.fromPixels(img);
            }
            // Reshape to a single-element batch so we can pass it to executeAsync.
            return tf.expandDims(img);
        });
        const height = batched.shape[1];
        const width  = batched.shape[2];

        // model returns two tensors:
        // 1. box classification score with shape of [1, 1917, 90]
        // 2. box location with shape of [1, 1917, 1, 4]
        // where 1917 is the number of box detectors, 90 is the number of classes.
        // and 4 is the four coordinates of the box.
        const result = await this.model.executeAsync(batched);

        let scores, boxes;
        if(tf.getBackend() !== 'webgpu'){
            scores = result[0].dataSync();
            boxes  = result[1].dataSync();
        }else{
            scores = await result[0].data();
            boxes  = await result[1].data();
        }

        // clean the webgl tensors
        batched.dispose();
        tf.dispose(result);

        const [maxScores, classes] = this.calculateMaxScores(scores, result[0].shape[1], result[0].shape[2]);

        const boxes2 = tf.tensor2d(boxes, [result[1].shape[1], result[1].shape[3]]);
        const nms = await tf.image.nonMaxSuppressionAsync(
                                boxes2, maxScores, maxNumBoxes, minScore, minScore);
        let indexes;
        if(tf.getBackend() !== 'webgpu'){
            indexes = nms.dataSync();
        }else{
            indexes = await nms.data();
        }
        boxes2.dispose();
        nms.dispose();

        return this.buildDetectedObjects(
            width, height, boxes, maxScores, indexes, classes);
    };

    buildDetectedObjects(width, height, boxes, scores, indexes, classes){
      const count = indexes.length;
      const objects= [];
      for (let i = 0; i < count; i++) {
        const bbox = [];
        for (let j = 0; j < 4; j++) {
          bbox[j] = boxes[indexes[i] * 4 + j];
        }
        const minY = bbox[0] * height;
        const minX = bbox[1] * width;
        const maxY = bbox[2] * height;
        const maxX = bbox[3] * width;
        bbox[0] = minX;
        bbox[1] = minY;
        bbox[2] = maxX - minX;
        bbox[3] = maxY - minY;
        const obj = new DetectedObject();
        obj.state.bbox = bbox;
        obj.state.className = CLASSES[classes[indexes[i]] + 1].displayName;
        obj.state.score = scores[indexes[i]];
        objects.push(obj);
      }
      return objects;
    }
  
    calculateMaxScores(scores, numBoxes, numClasses) {
      const maxes = [];
      const classes = [];
      for (let i = 0; i < numBoxes; i++) {
        let max = Number.MIN_VALUE;
        let index = -1;
        for (let j = 0; j < numClasses; j++) {
          if (scores[i * numClasses + j] > max) {
            max = scores[i * numClasses + j];
            index = j;
          }
        }
        maxes[i] = max;
        classes[i] = index;
      }
      return [maxes, classes];
    }
};

export default MobileNetSSD;

