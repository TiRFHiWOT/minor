import React from 'react';
import { InlineContentEditor } from '@/components/admin/InlineContentEditor';

const defaultRulesContent = `# Minor Hockey Talks – Community Rules & Posting Guidelines

Welcome to Minor Hockey Talks – a forum created to foster respectful, insightful, and engaging conversations about youth hockey. These rules outline expectations for all members to ensure a positive and productive environment for players, parents, coaches, and fans.

## 🧾 General Community Guidelines

By using this forum, you agree to follow these rules, as well as our [Terms of Use](/terms) and [Privacy Policy](/privacy). These rules apply to all members and guests, and exist to promote respectful dialogue and protect the community.

## 📌 Posting Guidelines

Before posting, please keep the following in mind:

### Use Constructive Language
Share your opinions using examples and insights.
- ❌ "TM coach is an idiot for pulling his goalie."
- ✅ "The goalie was pulled while shorthanded with a minute left, which led to an empty-net goal. That decision was questionable."

### Avoid Personal Attacks
Criticism of decisions is fine — personal attacks on individuals, parents, players, or businesses are not. Keep discussion respectful and on-topic.

### No Repetitive Posts
Avoid posting the same opinion multiple times or repeating content already shared without adding value.

### Don't Quote Problematic Posts
If you quote a post that violates the rules and it gets removed, your quote may also be removed. Stick to your own words.

### Do Not Single Out Children
Avoid criticizing specific players by name or number.
- ❌ "#14 on defense was terrible."
- ✅ "The defense had a tough time last night — several players were caught flat-footed."

### Use Initials or General Descriptions When Possible
When referring to parents, coaches, or players, use initials or general terms unless the person is a public figure (e.g., NHL player, coach, or someone already in the public domain).

## 🔒 Moderation & Responsibility

Posts are reviewed for the greater good of the community, based on the rules above.

- You are responsible for everything you post.
- While guest posts may appear anonymous, your IP address and post data are logged for moderation and safety purposes.
- Moderators may remove, edit, or restrict posts that violate these rules without prior notice.

## 🚩 Reporting Posts

To report a post:

1. Click the flag icon below the post.
2. The post will be immediately hidden from public view pending moderator review.
3. Provide a brief explanation of the concern when prompted.

**Please note:**
- A flagged post is not automatically deleted.
- Just because you disagree with someone's opinion does not mean it violates the rules or will be permanently removed.
- All flags are reviewed within 24 hours.

## 📬 Contact Us

Have a question or concern? Use the "Contact Us" link at the bottom of any page to reach out to the site administrators.`;

const ForumRules = () => {
  return (
    <InlineContentEditor
      settingKey="forum_rules_content"
      title="Forum Rules"
      defaultContent={defaultRulesContent}
    />
  );
};

export default ForumRules;