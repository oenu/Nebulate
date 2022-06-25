import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const Popup = () => {
  return (
    <>
      <h1>I am a popup</h1>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
