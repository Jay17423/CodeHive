import React from "react";


const ShimmerUi = () => {
  return (
    <div className="shimmer-container">
      {/* Text Placeholder */}
      <div className="shimmer-text"></div>
      <div className="shimmer-text short"></div>

      {/* Code Block Placeholder */}
      <div className="shimmer-code">
        <div className="shimmer-line"></div>
        <div className="shimmer-line"></div>
        <div className="shimmer-line"></div>
        <div className="shimmer-line short"></div>
      </div>
    </div>
  );
};

export default ShimmerUi;
