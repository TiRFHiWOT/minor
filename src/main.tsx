console.log('🔥 MAIN.TSX SCRIPT STARTED');

// Test if basic DOM access works
const root = document.getElementById("root");
if (root) {
  console.log('✅ ROOT ELEMENT FOUND');
  root.innerHTML = '<div style="padding: 20px; color: green; font-family: Arial;"><h1>Basic Script Works</h1><p>If you see this, the script is running</p></div>';
} else {
  console.error('❌ ROOT ELEMENT NOT FOUND');
}

// Test if we can import React modules
try {
  console.log('📦 Testing React import...');
  import('react').then(() => {
    console.log('✅ React import successful');
  }).catch(err => {
    console.error('❌ React import failed:', err);
  });
} catch (err) {
  console.error('❌ React import error:', err);
}