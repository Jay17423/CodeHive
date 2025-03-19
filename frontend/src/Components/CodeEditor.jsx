
import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ language, code, handleCodeChange }) => {
  return (
    <Editor
      height={"70%"}
      defaultLanguage={language}
      language={language}
      value={code}
      onChange={handleCodeChange}
      theme="vs-dark"
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 16,
      }}
    />
  );
};

export default CodeEditor;