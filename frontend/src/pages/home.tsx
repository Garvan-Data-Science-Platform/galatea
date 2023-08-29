import LoginButton from "components/LoginButton";
import { FileBrowser } from "components/FileBrowser";
import { ImageCanvas } from "components/ImageCanvas";

const Home = () => {
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
            //setCurrentImg(file.url);
          }}
        />
        <ImageCanvas />
      </div>
      <div>
        <LoginButton />
      </div>
    </>
  );
};
export default Home;
