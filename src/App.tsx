import { useRef, RefCallback, useCallback } from "react";
import { InputImage, Pose, Results } from "@mediapipe/pose";
import { ControlPanel, SourcePicker } from "@mediapipe/control_utils";
import "@mediapipe/control_utils/control_utils.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const controlPanelRef = useCallback<RefCallback<HTMLElement>>((node) => {
    if (!node) return;

    const onResults = (results: Results) => {
      console.log("%cApp.tsx line:25 results", "color: #26bfa5;", results);
    };

    const draw = (results: { image: InputImage }) => {
      const canvasElement = canvasRef.current;

      const canvasCtx = canvasElement?.getContext("2d");

      if (canvasCtx && canvasElement) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
        canvasCtx.restore();
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
    new ControlPanel(node, {
      ref_video: 0,
      is_record: false,
    }).add([
      new SourcePicker({
        onFrame: async (input, size) => {
          console.log("%cApp.tsx line:56 input", "color: #26bfa5;", input);

          const aspect = size.height / size.width;
          let width, height;
          if (window.innerWidth > window.innerHeight) {
            height = window.innerHeight;
            width = height / aspect;
          } else {
            width = window.innerWidth;
            height = width * aspect;
          }

          if (!canvasRef.current) return;

          canvasRef.current.width = width;
          canvasRef.current.height = height;

          draw({ image: input });
        },
      }),
    ]);
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "20%",
        }}
      />
      <div
        ref={controlPanelRef}
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
