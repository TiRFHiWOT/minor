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
      console.log('✅ Step 1: React imported successfully');
      console.log('📦 Step 2: Testing react-dom/client import...');
      return import('react-dom/client');
    })
    .then((ReactDOM) => {
      console.log('✅ Step 2: ReactDOM imported successfully');
      console.log('📦 Step 3: Testing createRoot...');
      const { createRoot } = ReactDOM;
      const reactRoot = createRoot(root);
      console.log('✅ Step 3: createRoot successful');
      
      console.log('📦 Step 4: Testing CSS import...');
      return import('./index.css').then(() => ({ reactRoot }));
    })
    .then(({ reactRoot }) => {
      console.log('✅ Step 4: CSS imported successfully');
      console.log('📦 Step 5: Testing App import...');
      return import('./App.tsx').then(AppModule => ({ reactRoot, AppModule }));
    })
    .then(({ reactRoot, AppModule }) => {
      console.log('✅ Step 5: App imported successfully');
      const App = AppModule.default;
      
      console.log('📦 Step 6: Testing React.createElement...');
      const element = ReactModule.createElement('div', { style: { padding: '20px', color: 'blue' } }, 'React element works!');
      console.log('✅ Step 6: React.createElement successful');
      
      console.log('📦 Step 7: Testing basic render...');
      reactRoot.render(element);
      console.log('✅ Step 7: Basic render successful');
      
      // Now try the actual App component with detailed error catching
      setTimeout(() => {
        console.log('📦 Step 8: About to test App component...');
        console.log('App component details:', App);
        console.log('App.name:', App?.name);
        console.log('App.prototype:', App?.prototype);
        
        try {
          console.log('📦 Step 8a: Creating App element...');
          const appElement = ReactModule.createElement(App);
          console.log('✅ Step 8a: App element created successfully', appElement);
          
          console.log('📦 Step 8b: Rendering App element...');
          reactRoot.render(appElement);
          console.log('✅ Step 8b: App component rendered successfully');
          
        } catch (appError) {
          console.error('❌ STEP 8 APP ERROR:', appError);
          console.error('App error details:', {
            name: appError?.name,
            message: appError?.message,
            stack: appError?.stack
          });
          
          // Render error message but keep it on screen
          const errorElement = ReactModule.createElement('div', 
            { style: { padding: '20px', color: 'red', fontFamily: 'Arial' } },
            ReactModule.createElement('h1', null, 'App Component Error'),
            ReactModule.createElement('p', null, `Error: ${appError?.message || 'Unknown app error'}`),
            ReactModule.createElement('p', null, 'App component failed to render')
          );
          reactRoot.render(errorElement);
        }
      }, 2000);
    })
    .catch(error => {
      console.error('❌ IMPORT ERROR:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      root.innerHTML = `
        <div style="padding: 20px; color: red; font-family: Arial;">
          <h1>Import Error</h1>
          <p>Error: ${error?.message || 'Unknown error'}</p>
          <p>Import step failed - check console</p>
        </div>
      `;
    });
}
