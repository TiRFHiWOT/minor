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
    </div>
  );
};

export default Privacy;