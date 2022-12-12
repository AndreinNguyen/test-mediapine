import { useRef, useCallback, RefCallback, useState } from "react";
import { InputImage, LandmarkList, Pose, Results } from "@mediapipe/pose";

import { ControlPanel, SourcePicker, Toggle } from "@mediapipe/control_utils";
import { Camera } from "@mediapipe/camera_utils";
import "@mediapipe/control_utils/control_utils.css";

const DEFAULT_POSE_PER_FRAME = 5;
const onSubmit = (recordData: LandmarkList[]) => {
  console.log("%cApp.tsx line:223 record_data", "color: #26bfa5;", recordData);
};

function App() {
  // const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isShow, setIsShow] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  const [camera, setCamera] = useState<Camera | null>(null);

  const cameraRef = useCallback<RefCallback<HTMLVideoElement>>(
    (node: HTMLVideoElement | null) => {
      let recordData: LandmarkList[] = [];
      // let isRecord = false;
      let frameCount = 0;

      // const draw = (results: { image: InputImage }) => {
      //   const canvasElement = canvasRef.current;

      //   const canvasCtx = canvasRef.current?.getContext("2d");

      //   if (canvasCtx && canvasElement) {
      //     canvasCtx.save();
      //     canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      //     canvasCtx.drawImage(
      //       results.image,
      //       0,
      //       0,
      //       canvasElement.width,
      //       canvasElement.height
      //     );

      //     canvasCtx.restore();
      //   }
      // };

      const onResults = (results: Results) => {
        if (isRecord) {
          if (!(results.poseWorldLandmarks === undefined)) {
            recordData.push(results.poseWorldLandmarks);
          }
        }
      };

      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        selfieMode: false,
        modelComplexity: 2,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onResults);

      if (node) {
        const camera = new Camera(node, {
          onFrame: async () => {
            console.log("%cApp.tsx line:73 Object", "color: #26bfa5;");
            // const aspect = node.videoHeight / node.videoWidth;
            // let width, height;
            // if (window.innerWidth > window.innerHeight) {
            //   height = window.innerHeight;
            //   width = height / aspect;
            // } else {
            //   width = window.innerWidth;
            //   height = width * aspect;
            // }
            // if (!canvasRef.current) return;
            // canvasRef.current.width = width;
            // canvasRef.current.height = height;
            if (frameCount % DEFAULT_POSE_PER_FRAME === 0) {
              await pose.send({ image: node });
            }
            frameCount += 1;
            // draw({ image: node });
          },
        });
        setCamera(camera);
        // camera.start();
      }

      // if (node && canvasRef.current) {
      //   new ControlPanel(node, {
      //     refVideo: 0,
      //     isRecord: false,
      //   })
      //     .add([
      //       new SourcePicker({
      //         onFrame: async (input, size) => {
      //           const aspect = size.height / size.width;
      //           let width, height;
      //           if (window.innerWidth > window.innerHeight) {
      //             height = window.innerHeight;
      //             width = height / aspect;
      //           } else {
      //             width = window.innerWidth;
      //             height = width * aspect;
      //           }
      //           if (!canvasRef.current) return;
      //           canvasRef.current.width = width;
      //           canvasRef.current.height = height;
      //           if (frameCount % DEFAULT_POSE_PER_FRAME === 0) {
      //             await pose.send({ image: input });
      //           }
      //           frameCount += 1;
      //           draw({ image: input });
      //         },
      //       }),
      //       new Toggle({ title: "Record", field: "isRecord" }),
      //     ])
      //     .on((optionsMap) => {
      //       if (optionsMap.isRecord) {
      //         recordData = [];
      //         console.log("recording");
      //         isRecord = true;
      //       } else {
      //         console.log("done recording");
      //         isRecord = false;
      //         if (recordData.length !== 0) {
      //           console.log("sending request");
      //           onSubmit(recordData);
      //           console.log("done");
      //         }
      //       }
      //     });
      // }
    },
    [isRecord]
  );

  return (
    <div>
      <div style={{ justifyContent: "center", display: "flex" }}>
        <button onClick={() => camera?.start()}>Turn on</button>
        <button onClick={() => setIsRecord(!isRecord)}>Record</button>
        <button onClick={() => camera?.stop()}>Turn off</button>
      </div>

      {/* <canvas
        ref={canvasRef}
        style={{
          width: "20%",
          display: "block",
          position: "relative",
          left: 0,
          top: 0,
        }}
      /> */}
      <video
        className="control"
        ref={cameraRef}
        style={{
          position: "absolute",
          left: "10px",
          top: "10px",
        }}
      />
    </div>
  );
}

export default App;
