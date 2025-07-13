import React from 'react';
import { InlineContentEditor } from '@/components/admin/InlineContentEditor';

const ForumRules = () => {
  return (
    <InlineContentEditor
      settingKey="forum_rules_content"
      title="Forum Rules"
      defaultContent=""
    />
  );
};

export default ForumRules;