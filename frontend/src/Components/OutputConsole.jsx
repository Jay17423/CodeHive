
import React from "react";

const OutputConsole = ({ output }) => {
  return (
    <textarea
      className="output-console"
      value={output}
      readOnly
      placeholder="Output will appear here"
    />
  );
};

export default OutputConsole;