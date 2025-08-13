import React from 'react';
import { InlineContentEditor } from '@/components/admin/InlineContentEditor';

const Privacy = () => {
  return (
    <div>
      <InlineContentEditor
        settingKey="privacy_content"
        title="Privacy Policy"
        defaultContent=""
      />
      {/* AdMetrics CMP Privacy Policy - required for privacy law compliance */}
      <div id="ampCMP_privacyPolicy" className="mt-4"></div>
    </div>
  );
};

export default Privacy;