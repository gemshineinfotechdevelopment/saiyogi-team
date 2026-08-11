import React from "react";

interface DiscountTagProps {
  discount: number;
  className?: string;
}

export const DiscountTag: React.FC<DiscountTagProps> = ({
  discount,
  className = "w-12 sm:w-16 h-auto",
}) => {
  return (
    <div className={`relative inline-block select-none filter drop-shadow-md hover:scale-110 transition-transform duration-300 pointer-events-none ${className}`}>
      {/* Exact Original Banner Image */}
      <img
        src="/discount-tag.png"
        alt={`${discount}% OFF`}
        className="w-full h-auto object-contain block"
      />

      {/* Dynamic Overlay Patch replacing the "80%" text with dynamic value */}
      <div
        className="absolute flex items-center justify-center pointer-events-none"
        style={{
          top: "22%",
          left: "27.5%",
          width: "53%",
          height: "26.5%",
          transform: "rotate(-5.5deg)",
          background: "linear-gradient(140deg, #FFE826 0%, #FFCD00 55%, #FFB600 100%)",
          borderRadius: "4px",
        }}
      >
        <span
          className="font-black italic leading-none text-center select-none"
          style={{
            fontFamily: "Arial, 'Helvetica Neue', 'Arial Black', sans-serif",
            fontSize: discount >= 100 ? "0.95em" : "1.2em",
            letterSpacing: "-0.01em",
            color: "#111111",
            fontWeight: 900,
          }}
        >
          {discount}%
        </span>
      </div>
    </div>
  );
};

export default DiscountTag;
