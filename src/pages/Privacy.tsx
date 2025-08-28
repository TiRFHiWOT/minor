import React from 'react';
import PrivacyPolicy from './PrivacyPolicy';

const Privacy = () => {
  return (
    <div>
      <InlineContentEditor
        settingKey="privacy_content"
        title="Privacy Policy"
        defaultContent=""
      />
      <div id="ampCMP_privacyPolicy"></div>
    </div>
  );
};

export default Privacy;