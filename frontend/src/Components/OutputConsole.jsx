import React from "react";
import { useSelector } from "react-redux";

const OutputConsole = () => {
  // Get consoleText from Redux state
  const consoleText = useSelector((state) => state.code.consoleText);

  return (
    <textarea
      className="output-console"
      value={consoleText}
      readOnly
      placeholder="Output will appear here"
    />
  );
};

export default OutputConsole;
