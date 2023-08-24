import LoginButton from "components/LoginButton";
import React from "react";
import { FileBrowser } from "components/FileBrowser";

const Home = () => {
  const [currentImg, setCurrentImg] = React.useState<string>();
  const canvasRef = React.useRef<HTMLCanvasElement>();
  const imageRef = React.useRef<HTMLImageElement>();
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (loaded) {
      const canvas = canvasRef.current;
      canvas.addEventListener("mousedown", function (e) {
        getCursorPosition(canvas, e);
      });
      const ctx = canvas.getContext("2d");
      const img = imageRef.current;
      img.height = 600;
      img.width = 600;
      img.src = currentImg || "";
      ctx.drawImage(img, 0, 0);
    }
  }, [loaded]);

  function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log("x: " + x + " y: " + y);
  }

  return (
    <>
      <div
        style={{
          width: 1200,
          height: 600,
          //backgroundColor: "rgba(130, 130, 130, 0.5)",
          flexDirection: "row",
          display: "flex",
        }}
      >
        <FileBrowser
          bucket="cabana-dev"
          onSelectFile={(file) => {
            console.log("Setting image to", file.url);
            setCurrentImg(file.url);
          }}
        />

        <div style={{ width: 600, height: 600, backgroundColor: "#c9c5c5" }}>
          <canvas width={600} height={600} ref={canvasRef} />
          <img
            width={600}
            height="auto"
            src={currentImg}
            ref={imageRef}
            onLoad={() => {
              setLoaded(true);
            }}
            style={{ display: "none" }}
          />
        </div>
      </div>
      <div>
        <LoginButton />
      </div>
    </>
  );
};
export default Home;
