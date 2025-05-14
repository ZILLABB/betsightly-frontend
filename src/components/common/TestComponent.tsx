import React, { useState } from 'react';

/**
 * A simple test component to verify that React is working properly
 */
const TestComponent: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Test Component</h2>
      <p className="mb-4">This is a test component to verify that React is working properly.</p>
      <div className="flex items-center justify-center mb-4">
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          onClick={() => setCount(count - 1)}
        >
          -
        </button>
        <span className="text-xl font-bold mx-4">{count}</span>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-2"
          onClick={() => setCount(count + 1)}
        >
          +
        </button>
      </div>
      <p className="text-sm text-gray-300">
        If you can see this component and the buttons work, React is functioning correctly.
      </p>
    </div>
  );
};

export default TestComponent;
