"use client"
import { useState } from 'react';


export default function StoreCreator() {
  
const [streamingUpdates, setStreamingUpdates] = useState({});

// Function to handle streaming updates from the server
const handleStreamingUpdates = async () => {
  // Set initial state
  setStreamingUpdates({
    message: "Preparing to create store...",
    step: 0,
    progress: 0
  });

  try {
    // Create EventSource connection to the streaming API
    const eventSource = new EventSource('/api/stream-updates');
    
    // Handle incoming messages
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received update:', data);
      
      // Update state with the new data
      setStreamingUpdates(data);
      
      // If we received the final message with a storeUrl, update the form state
      if (data.progress === 100 && data.storeUrl) {
        // Close the connection
        eventSource.close();
        
        // Submit the form data to the actual API
      }
    };
    
    // Handle errors
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setStreamingUpdates(prev => prev ? {
        ...prev,
        error: 'Connection to server lost. Please try again.'
      } : null);
      eventSource.close();
    };
  } catch (error) {
    console.error('Error setting up EventSource:', error);
    setStreamingUpdates(prev => prev ? {
      ...prev,
      error: 'Failed to connect to server. Please try again.'
    } : null);
  }
};


  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Shopify Store Creator</h1>
      <p className="text-lg mb-8 text-center max-w-3xl mx-auto">
        Create customized Shopify Hydrogen storefronts in minutes through this intuitive form interface.
      </p>
      <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          type="button"
          onClick={handleStreamingUpdates}>
            Click me
          </button>
          {streamingUpdates.error && (
            <div className="text-red-500 mt-4">
              <p>Error: {streamingUpdates.error}</p>
            </div>
          )}
          {streamingUpdates.message && (
            <div className="text-gray-700 mt-4">
              <p>{streamingUpdates.message}</p>
              <p>Step: {streamingUpdates.step}</p>
              <p>Progress: {streamingUpdates.progress}%</p>
            </div>
          )}
        </div>
      );
}