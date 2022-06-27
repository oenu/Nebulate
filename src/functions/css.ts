export const loadCSS = (css: string) => {
  if (css === "nebula") {
    var head = document.head || document.getElementsByTagName("head")[0];
    const style = document.createElement("style");
    style.id = "nebulate-extension";
    style.textContent = generateNebulaStyling();
    console.log("loading styling");
    head.appendChild(style);
  }
};

export const unloadCSS = () => {
  var cssNode = document.getElementById("nebulate-extension");
  cssNode?.parentNode?.removeChild(cssNode);
};

export const setBg = (css: string) => {
  unloadCSS();
  setTimeout(() => loadCSS(css));
};

export const generateNebulaStyling = () => {
  console.log("Generating nebula styling");
  const css = `#player {
    transform: translateY(0); \n
    box-shadow: \n
      inset 0 0 60px whitesmoke, \n
      inset 20px 0 80px #f0f, \n
      inset -20px 0 80px #0ff, \n
      inset 20px 0 300px #f0f, \n
      inset -20px 0 300px #0ff, \n
      0 0 50px #fff, \n
      -10px 0 80px #f0f, \n
      10px 0 80px #0ff; \n
  }\n`;
  return css;
};

/**
 * const css = `html body {
 * background: url(${url}); \n
 * image-rendering: crisp-edges; \n
 * image-rendering: -webkit-optimize-contrast; \n
 * background-size:     cover; \n
 * background-repeat:   no-repeat; \n
 * background-position: center center; \n
 * }\n`;
 */
