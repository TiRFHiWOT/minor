import React from 'react';
import { InlineContentEditor } from '@/components/admin/InlineContentEditor';

const Privacy = () => {
  return (
    <InlineContentEditor
      settingKey="privacy_content"
      title="Privacy Policy"
      defaultContent=""
    />
  );
};

export default Privacy;