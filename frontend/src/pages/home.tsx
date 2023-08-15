import LoginButton from "components/LoginButton";
import React from "react";
import { FileBrowser } from "components/FileBrowser";

const Home = () => {
  return (
    <>
      <div
        style={{
          width: 500,
          height: 800,
          backgroundColor: "rgba(130, 130, 130, 0.5)",
        }}
      >
        <FileBrowser
          bucket="cabana-dev"
          onSelectFile={(file) => {
            console.log("File selected");
          }}
        />
      </div>
      <LoginButton />
    </>
  );
};
export default Home;
