// Placeholder
import React from "react";
import ReactDOM from "react-dom";
ReactDOM.render(<Popup />, document.getElementById("root"));

function Popup() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "8rem",
      }}
    >
      A graduate project by @oenu, this is in beta.
      <div></div>
      <a href="https://github.com/oenu">github</a>
      <div></div>
      <a href="https://twitter.com/_a_nb">twitter</a>
    </div>
  );
}
