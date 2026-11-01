/**
 * Musify Player — Native Figma Document & Canvas Generator Script
 * 
 * Target File: Musify Player (bnEkyVmLu5vDDo4GzkUh7M)
 * Can be run via Figma MCP Bridge or pasted into Figma Desktop Console (Ctrl+Shift+I / DevTools)
 */

(async function createMusifyPlayer() {
  console.log("Starting Musify Player canvas generation...");

  // Load required fonts
  try {
    await figma.loadFontAsync({ family: "Instrument Serif", style: "Regular" });
  } catch (e) {
    console.warn("Instrument Serif not found in local system, falling back to Georgia for display:", e);
    await figma.loadFontAsync({ family: "Georgia", style: "Regular" });
  }

  try {
    await figma.loadFontAsync({ family: "Instrument Sans", style: "Regular" });
    await figma.loadFontAsync({ family: "Instrument Sans", style: "Medium" });
  } catch (e) {
    console.warn("Instrument Sans not found in local system, falling back to Inter:", e);
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  }

  // Helper colors
  const C = {
    bgStage: { r: 0.043, g: 0.043, b: 0.047 }, // #0B0B0C
    bgBase: { r: 0.078, g: 0.078, b: 0.082 },  // #141415
    bgCard: { r: 0.098, g: 0.098, b: 0.106 },  // #19191B
    bgRaised: { r: 0.137, g: 0.137, b: 0.145 },// #232325
    hairline: { r: 0.929, g: 0.929, b: 0.929 },// rgba(237,237,237,0.08)
    text1: { r: 0.929, g: 0.929, b: 0.929 },   // #EDEDED
    text2: { r: 0.631, g: 0.631, b: 0.651 },   // #A1A1A6
    text3: { r: 0.522, g: 0.522, b: 0.545 },   // #85858B
    accentRed: { r: 0.851, g: 0.169, b: 0.220 },// #D92B38
    accentWarm: { r: 0.886, g: 0.529, b: 0.263 },// #E28743
    accentCool: { r: 0.220, g: 0.639, b: 0.831 },// #38A3D4
    accentMono: { r: 0.612, g: 0.667, b: 0.722 },// #9CAAB8
  };

  function setSolidFill(node, color, opacity = 1) {
    node.fills = [{ type: 'SOLID', color: color, opacity: opacity }];
  }

  function setHairlineStroke(node) {
    node.strokes = [{ type: 'SOLID', color: C.hairline, opacity: 0.08 }];
    node.strokeWeight = 1;
  }

  // 1. Pages Setup
  const pageNames = [
    "1. Tokens",
    "2. Variant A (Quiet)",
    "3. Variant B (Artwork Colour)",
    "4. Components",
    "5. Screens",
    "6. Motion Spec"
  ];

  const pages = {};
  for (let i = 0; i < pageNames.length; i++) {
    let p = figma.root.children.find(c => c.name === pageNames[i]);
    if (!p) {
      if (i === 0 && figma.root.children.length > 0) {
        p = figma.root.children[0];
        p.name = pageNames[i];
      } else {
        p = figma.createPage();
        p.name = pageNames[i];
      }
    }
    pages[pageNames[i]] = p;
  }

  // Page 1: Tokens Frame
  figma.currentPage = pages["1. Tokens"];
  const tokensFrame = figma.createFrame();
  tokensFrame.name = "Tokens & Variable Spec (1440x900)";
  tokensFrame.resize(1440, 900);
  tokensFrame.x = 0;
  tokensFrame.y = 0;
  setSolidFill(tokensFrame, C.bgStage);

  const titleNode = figma.createText();
  try {
    titleNode.fontName = { family: "Instrument Serif", style: "Regular" };
  } catch {
    titleNode.fontName = { family: "Georgia", style: "Regular" };
  }
  titleNode.characters = "Musify Design Tokens";
  titleNode.fontSize = 40;
  setSolidFill(titleNode, C.text1);
  titleNode.x = 64;
  titleNode.y = 64;
  tokensFrame.appendChild(titleNode);

  // Page 2: Variant A (Quiet)
  figma.currentPage = pages["2. Variant A (Quiet)"];
  const quietDesktop = figma.createFrame();
  quietDesktop.name = "Variant A Quiet - Desktop Now Playing (1440x900)";
  quietDesktop.resize(1440, 900);
  setSolidFill(quietDesktop, C.bgStage);

  const quietMobile = figma.createFrame();
  quietMobile.name = "Variant A Quiet - Mobile Now Playing (390x844)";
  quietMobile.resize(390, 844);
  quietMobile.x = 1540;
  setSolidFill(quietMobile, C.bgStage);

  // Page 3: Variant B (Artwork Colour)
  figma.currentPage = pages["3. Variant B (Artwork Colour)"];
  const warmFrame = figma.createFrame();
  warmFrame.name = "Variant B Warm (Terracotta) - Desktop (1440x900)";
  warmFrame.resize(1440, 900);
  setSolidFill(warmFrame, { r: 0.059, g: 0.047, b: 0.039 }); // #0F0C0A

  const coolFrame = figma.createFrame();
  coolFrame.name = "Variant B Cool (Indigo/Cyan) - Desktop (1440x900)";
  coolFrame.resize(1440, 900);
  coolFrame.x = 1540;
  setSolidFill(coolFrame, { r: 0.035, g: 0.051, b: 0.071 }); // #090D12

  const monoFrame = figma.createFrame();
  monoFrame.name = "Variant B Monochrome (Slate) - Desktop (1440x900)";
  monoFrame.resize(1440, 900);
  monoFrame.x = 3080;
  setSolidFill(monoFrame, { r: 0.047, g: 0.051, b: 0.055 }); // #0C0D0E

  // Page 4: Components
  figma.currentPage = pages["4. Components"];
  const compFrame = figma.createFrame();
  compFrame.name = "Components Matrix (8 States Each)";
  compFrame.resize(1440, 900);
  setSolidFill(compFrame, C.bgStage);

  // Page 5: Screens
  figma.currentPage = pages["5. Screens"];
  const screensOverview = figma.createFrame();
  screensOverview.name = "Screens Index (Desktop & Mobile)";
  screensOverview.resize(1440, 900);
  setSolidFill(screensOverview, C.bgStage);

  // Page 6: Motion Spec
  figma.currentPage = pages["6. Motion Spec"];
  const motionFrame = figma.createFrame();
  motionFrame.name = "Motion Spec Table (Physics & Timings)";
  motionFrame.resize(1440, 900);
  setSolidFill(motionFrame, C.bgStage);

  console.log("Musify Player pages generated successfully.");
  figma.notify("Musify Player structure created successfully!");
})();
