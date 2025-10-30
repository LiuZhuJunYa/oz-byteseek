import React from "react";
import { createRoot } from "react-dom/client";
import App from "./example_index.jsx"; // 你的组件文件

const root = createRoot(document.getElementById("root"));
root.render(<App />);
