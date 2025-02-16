import React from "react";
import "./App.css";
import io from "socket.io-client";

const soket = io("http://localhost:5050");

const App = () => {
  return <div>Code Hive</div>;
};

export default App;
