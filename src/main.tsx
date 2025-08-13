console.log('🔥 MAIN.TSX SCRIPT STARTED');

const root = document.getElementById("root");
if (!root) {
  console.error('❌ ROOT ELEMENT NOT FOUND');
} else {
  console.log('✅ ROOT ELEMENT FOUND');
  
  // Test React imports step by step
  let ReactModule: any;
  
  Promise.resolve()
    .then(() => {
      console.log('📦 Step 1: Testing React import...');
      return import('react');
    })
    .then((React) => {
      ReactModule = React;
      console.log('✅ Step 1: React imported successfully', React);
      console.log('📦 Step 2: Testing react-dom/client import...');
      return import('react-dom/client');
    })
    .then((ReactDOM) => {
      console.log('✅ Step 2: ReactDOM imported successfully', ReactDOM);
      console.log('📦 Step 3: Testing createRoot...');
      const { createRoot } = ReactDOM;
      const reactRoot = createRoot(root);
      console.log('✅ Step 3: createRoot successful', reactRoot);
      
      console.log('📦 Step 4: Testing CSS import...');
      return import('./index.css').then(() => ({ reactRoot }));
    })
    .then(({ reactRoot }) => {
      console.log('✅ Step 4: CSS imported successfully');
      console.log('📦 Step 5: Testing App import...');
      return import('./App.tsx').then(AppModule => ({ reactRoot, AppModule }));
    })
    .then(({ reactRoot, AppModule }) => {
      console.log('✅ Step 5: App imported successfully', AppModule);
      const App = AppModule.default;
      
      console.log('📦 Step 6: Testing React.createElement...');
      // Try basic React element first
      const element = ReactModule.createElement('div', { style: { padding: '20px', color: 'blue' } }, 'React element works!');
      console.log('✅ Step 6: React.createElement successful', element);
      
      console.log('📦 Step 7: Testing basic render...');
      reactRoot.render(element);
      console.log('✅ Step 7: Basic render successful');
      
      // Now try the actual App component
      setTimeout(() => {
        console.log('📦 Step 8: Testing App component render...');
        reactRoot.render(ReactModule.createElement(App));
        console.log('✅ Step 8: App component render successful');
      }, 2000);
    })
    .catch(error => {
      console.error('❌ IMPORT/RENDER ERROR AT STEP:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      root.innerHTML = `
        <div style="padding: 20px; color: red; font-family: Arial;">
          <h1>React Error Found</h1>
          <p>Error: ${error?.message || 'Unknown error'}</p>
          <p>Step failed - check console for details</p>
        </div>
      `;
    });
}