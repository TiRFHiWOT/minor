console.log('🔥 MAIN.TSX SCRIPT STARTED');

// Add global error handlers first
window.addEventListener('error', (event) => {
  console.error('🔴 GLOBAL ERROR CAUGHT:', event.error);
  console.error('Message:', event.message);
  console.error('Filename:', event.filename);
  console.error('Line:', event.lineno, 'Column:', event.colno);
  
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h1>Global Error Caught</h1>
        <p>Error: ${event.message}</p>
        <p>File: ${event.filename}:${event.lineno}</p>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
  
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: orange; font-family: Arial;">
        <h1>Promise Rejection</h1>
        <p>Error: ${event.reason?.message || event.reason}</p>
      </div>
    `;
  }
});

const root = document.getElementById("root");
if (!root) {
  console.error('❌ ROOT ELEMENT NOT FOUND');
} else {
  console.log('✅ ROOT ELEMENT FOUND');
  
  // Test React imports step by step
  let ReactModule: any;
  let reactRoot: any;
  
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
      reactRoot = createRoot(root);
      console.log('✅ Step 3: createRoot successful');
      
      console.log('📦 Step 4: Testing CSS import...');
      return import('./index.css');
    })
    .then(() => {
      console.log('✅ Step 4: CSS imported successfully');
      console.log('📦 Step 5: Testing App import...');
      return import('./App.tsx');
    })
    .then((AppModule) => {
      console.log('✅ Step 5: App imported successfully');
      const App = AppModule.default;
      
      console.log('📦 Step 6: Testing React.createElement...');
      const element = ReactModule.createElement('div', { style: { padding: '20px', color: 'blue' } }, 'React element works!');
      console.log('✅ Step 6: React.createElement successful');
      
      console.log('📦 Step 7: Testing basic render...');
      reactRoot.render(element);
      console.log('✅ Step 7: Basic render successful');
      
      // Immediate App component test without setTimeout
      console.log('📦 Step 8: IMMEDIATE App component test...');
      console.log('App component:', App);
      
      return new Promise((resolve, reject) => {
        try {
          console.log('📦 Step 8a: Creating App element...');
          const appElement = ReactModule.createElement(App);
          console.log('✅ Step 8a: App element created', appElement);
          
          console.log('📦 Step 8b: About to render App...');
          reactRoot.render(appElement);
          console.log('✅ Step 8b: App render call completed');
          
          // Wait a bit to see if render completes
          setTimeout(() => {
            console.log('📦 Step 8c: Checking if App rendered...');
            resolve('App render completed');
          }, 100);
          
        } catch (appError) {
          console.error('❌ STEP 8 SYNC ERROR:', appError);
          reject(appError);
        }
      });
    })
    .then((result) => {
      console.log('✅ SUCCESS:', result);
    })
    .catch(error => {
      console.error('❌ PROMISE CHAIN ERROR:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      // Show error but don't clear blue message immediately
      const errorElement = ReactModule ? ReactModule.createElement('div', 
        { style: { padding: '20px', color: 'red', fontFamily: 'Arial', backgroundColor: 'white' } },
        ReactModule.createElement('h1', null, 'Promise Chain Error'),
        ReactModule.createElement('p', null, `Error: ${error?.message || 'Unknown error'}`),
        ReactModule.createElement('pre', null, error?.stack || 'No stack trace')
      ) : null;
      
      if (errorElement && reactRoot) {
        reactRoot.render(errorElement);
      } else {
        root.innerHTML = `
          <div style="padding: 20px; color: red; font-family: Arial;">
            <h1>Promise Chain Error</h1>
            <p>Error: ${error?.message || 'Unknown error'}</p>
          </div>
        `;
      }
    });
}