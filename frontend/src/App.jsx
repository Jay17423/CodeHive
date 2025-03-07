import React, { useState } from "react";
import "./App.css";
import io from "socket.io-client";

const soket = io("http://localhost:5050");

const App = () => {

  const [joined , setJoined] = useState(false);

  if( !joined ){
    return <div> App not joined </div>
  }
  return <div>User joined</div>;
};

export default App;
