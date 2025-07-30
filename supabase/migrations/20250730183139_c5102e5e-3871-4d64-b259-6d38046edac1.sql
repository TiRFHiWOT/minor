-- Add AdMetricsPro script to header_scripts setting
INSERT INTO forum_settings (setting_key, setting_value, setting_type, category, description, is_public, created_at, updated_at)
VALUES (
  'header_scripts',
  '[{
    "id": "admetrics-pro-script",
    "name": "AdMetricsPro Script",
    "description": "Main AdMetricsPro script for ad serving and management",
    "script": "<script type=\"text/javascript\">\n(function() {\n  // AdMetricsPro Configuration\n  window.amp_config = {\n    site_id: \"minorhockeytalks\",\n    ad_units: {\n      \"div-gpt-ad-1715358540790-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"leaderboard-top\"\n      },\n      \"div-gpt-ad-1752247623844-0\": {\n        sizes: [[300, 250], [336, 280]],\n        mapping: \"sidebar-left\"\n      },\n      \"div-gpt-ad-1752247724892-0\": {\n        sizes: [[300, 250], [336, 280]],\n        mapping: \"sidebar-left2\"\n      },\n      \"div-gpt-ad-1715358598569-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"content-one\"\n      },\n      \"div-gpt-ad-1715358620345-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"content-two\"\n      },\n      \"div-gpt-ad-1715358644170-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"content-three\"\n      },\n      \"div-gpt-ad-1715358664969-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"content-four\"\n      },\n      \"div-gpt-ad-1715358686825-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"content-five\"\n      },\n      \"div-gpt-ad-1715358709329-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"content-six\"\n      },\n      \"div-gpt-ad-1715358732097-0\": {\n        sizes: [[728, 90], [970, 90], [320, 50]],\n        mapping: \"content-seven\"\n      }\n    }\n  };\n\n  // Load AdMetricsPro\n  var script = document.createElement(\"script\");\n  script.src = \"https://admetrics.pro/js/amp.js\";\n  script.async = true;\n  script.onload = function() {\n    console.log(\"AdMetrics: ready\");\n    window.adMetricsReady = true;\n    \n    // Initialize ad refresh function\n    window.amp_refreshAllSlots = function() {\n      if (window.amp && window.amp.refreshAll) {\n        window.amp.refreshAll();\n        console.log(\"AdMetrics: refreshed all slots\");\n      }\n    };\n  };\n  document.head.appendChild(script);\n})();\n</script>",
    "is_active": true
  }]'::jsonb,
  'json',
  'advertising',
  'Header scripts for advertising and analytics',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();