import { useRef, useEffect, useState } from "react";
import {
  InputImage,
  Pose,
  POSE_CONNECTIONS,
  POSE_LANDMARKS_LEFT,
  POSE_LANDMARKS_NEUTRAL,
  POSE_LANDMARKS_RIGHT,
  Results,
} from "@mediapipe/pose";

import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  ControlPanel,
  SourcePicker,
  Toggle,
  Rectangle,
} from "@mediapipe/control_utils";
import "@mediapipe/control_utils/control_utils.css";
import axios from "axios";

let record_data: any[] = [];
let is_record = false;
const ref_video_id_list = ["2BBA4D"];

const DEFAULT_FRAME_TIME_PER_POSE = 5;

function App() {
  const controlPanelRef = document.getElementsByClassName(
    "control"
  )[0] as HTMLElement;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D | null>(
    null
  );

  const frame_count = useRef(0);
  // let frame_count = 0;

  const draw = (image: InputImage, size: Rectangle) => {
    const aspect = size.height / size.width;
    let width, height;
    if (window.innerWidth > window.innerHeight) {
      height = window.innerHeight;
      width = height / aspect;
    } else {
      width = window.innerWidth;
      height = width * aspect;
    }

    if (!canvasRef || !canvasRef.current) return;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const canvasElement = canvasRef.current;

    if (canvasCtx) {
      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        canvasElement?.width ?? 0,
        canvasElement?.height ?? 0
      );
      canvasCtx.drawImage(
        image,
        0,
        0,
        canvasElement?.width ?? 0,
        canvasElement?.height ?? 0
      );
      canvasCtx.restore();
    }
  };

  const onResults = (results: Results) => {
    if (is_record) {
      if (!(results.poseWorldLandmarks === undefined)) {
        record_data.push(results.poseWorldLandmarks);
      }
    }

    if (canvasCtx) {
      if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          visibilityMin: 0.65,
          color: "white",
        });
        drawLandmarks(
          canvasCtx,
          Object.values(POSE_LANDMARKS_LEFT).map(
            (index) => results.poseLandmarks[index]
          ),
          { visibilityMin: 0.65, color: "white", fillColor: "rgb(255,138,0)" }
        );
        drawLandmarks(
          canvasCtx,
          Object.values(POSE_LANDMARKS_RIGHT).map(
            (index) => results.poseLandmarks[index]
          ),
          { visibilityMin: 0.65, color: "white", fillColor: "rgb(0,217,231)" }
        );
        drawLandmarks(
          canvasCtx,
          Object.values(POSE_LANDMARKS_NEUTRAL).map(
            (index) => results.poseLandmarks[index]
          ),
          { visibilityMin: 0.65, color: "white", fillColor: "white" }
        );
      }
      canvasCtx.restore();
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      setCanvasCtx(canvasRef?.current.getContext("2d"));
    }
  }, []);

  useEffect(() => {
    // use to save frame
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

    if (controlPanelRef !== undefined) {
      new ControlPanel(controlPanelRef, {
        ref_video: 0,
        is_record: false,
      })
        .add([
          // new StaticText({ title: "Pose estimate" }),
          new SourcePicker({
            onFrame: async (input, size) => {
              if (frame_count.current % DEFAULT_FRAME_TIME_PER_POSE === 0) {
                await pose.send({ image: input });
              }
              frame_count.current += 1;

              // draw camera on website
              draw(input, size);
            },
          }),
          // new Slider({
          //   title: "Reference video",
          //   field: "ref_video",
          //   discrete: ref_video_id_list,
          // }),
          // fpsControl,
          new Toggle({ title: "Record", field: "is_record" }),
        ])
        .on((control) => {
          if (control["is_record"]) {
            record_data = [];
            console.log("recording");
            is_record = true;
          } else {
            console.log("done recording");
            // TODO: no need?
            // window.record_data = record_data;
            is_record = false;
            if (record_data.length !== 0) {
              console.log("sending request");
              axios({
                method: "post",
                url: `${process.env.REACT_APP_END_POINT}/ai/compare_pose_with_reference`,
                data: JSON.stringify({
                  data: record_data,
                  // @ts-ignore
                  ref_id: ref_video_id_list.at(control.ref_video.value),
                }),
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              })
                .then((response) => {
                  alert(
                    "The sequence similarity is " +
                      response.data.matching_score +
                      "%."
                  );
                  console.log(response);
                })
                .catch((error) => {
                  console.error(error);
                });
            }
            // else {
            //   alert("No data recorded");
            // }
          }
        });
    }
  }, [canvasRef.current]);

  return (
    <div
      style={{
        display: "relative",
        left: 0,
        top: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "20%",
          display: "block",
          left: 0,
          top: 0,
        }}
      />
      <div
        className="control"
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
