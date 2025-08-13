import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'

console.log('🔥 MAIN.TSX STARTED');

// Test App components gradually
const TestApp = () => {
  console.log('🧪 TestApp component rendering...');
  
  // Test basic imports first
  try {
    console.log('📦 Testing React Router import...');
    const { BrowserRouter } = require('react-router-dom');
    console.log('✅ React Router imported');
    
    console.log('📦 Testing QueryClient import...');
    const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
    console.log('✅ QueryClient imported');
    
    console.log('📦 Testing HelmetProvider import...');
    const { HelmetProvider } = require('react-helmet-async');
    console.log('✅ HelmetProvider imported');
    
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'lightgreen', 
        padding: '20px',
        fontSize: '16px',
        color: 'black'
      }}>
        <h1>✅ Basic Imports Working!</h1>
        <p>React Router: ✅</p>
        <p>React Query: ✅</p>
        <p>React Helmet: ✅</p>
        <p>Testing main App imports...</p>
      </div>
    );
    
  } catch (error) {
    console.error('❌ Import test failed:', error);
    return (
      <div style={{ padding: '20px', background: 'red', color: 'white' }}>
        <h1>Import Error</h1>
        <p>Error: {error.message}</p>
      </div>
    );
  }
};

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found');
  
  root.innerHTML = '<div style="padding: 20px; background: lime; color: black; font-size: 24px;">React is starting...</div>';
  
  const reactRoot = createRoot(root);
  
  setTimeout(() => {
    console.log('🚀 Testing App imports...');
    
    try {
      reactRoot.render(React.createElement(TestApp));
      console.log('✅ Import test rendered');
      
    } catch (renderError) {
      console.error('❌ Import test render error:', renderError);
      root.innerHTML = `<div style="padding: 20px; background: red; color: white;">Import Test Error: ${renderError.message}</div>`;
    }
    
  }, 500);
}