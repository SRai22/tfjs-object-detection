import React, {useRef, useEffect} from 'react';
import Webcam from "react-webcam";
import { Camera } from "@mediapipe/camera_utils";
import { setupStats } from './StatsPanel';


export function ObjectDetection(){
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    let stats;

    const runDetection =() =>{
        stats = new setupStats();
        const camera = new Camera(webcamRef.current.video,{
            onFrame: async () =>{
                
            },
            facingMode:"environment",
            width: 640,
            height: 480
        });
        camera.start();
    }

    return(
        <>
        <Webcam ref = {webcamRef} />
        <canvas
        ref={canvasRef}
        className="output_canvas"
        style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: 640,
            height: 480,
        }}
        >
        </canvas>
        <button onClick={runDetection}>turn on model</button>
        </>
    )
}