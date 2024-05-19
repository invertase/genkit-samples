export default function LoadingOverlay() {
  return (
    <>
      <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-700 bg-opacity-40"></div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
        <div className="w-20 h-20 animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 16 16"
          >
            <path
              d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
              fill="white"
            />
          </svg>
        </div>
        <div className="text-white lg:text-xl mt-2 font-bold opacity-80 animate-pulse w-full text-center">
          Gemini is thinking...
        </div>
      </div>
    </>
  );
}
