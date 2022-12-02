// eslint-disable-next-line no-undef
export const createStyledSvg = (color: string): SVGElement => {
  // eslint-disable-next-line no-undef
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "54");
  svg.setAttribute("height", "54");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke", color);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  // eslint-disable-next-line no-undef
  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("stroke", "none");
  path1.setAttribute("d", "M0 0h24v24H0z");
  path1.setAttribute("fill", "none");
  svg.appendChild(path1);

  // eslint-disable-next-line no-undef
  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute(
    "d",
    "M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"
  );
  svg.appendChild(path2);

  // eslint-disable-next-line no-undef
  const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path3.setAttribute("d", "M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3");
  svg.appendChild(path3);

  // eslint-disable-next-line no-undef
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", "15");
  circle.setAttribute("cy", "9");
  circle.setAttribute("r", "1");
  svg.appendChild(circle);

  return svg;
};
