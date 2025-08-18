import { htmlToText } from '@/utils/htmlToText';

export const FORUM_NAME = 'Minor Hockey Talks'; // Legacy constant for backwards compatibility

export interface AutoSeoOptions {
  topicTitle?: string;
  categoryName?: string;
  topicContent?: string;
  useAutoGeneration?: boolean;
  forumName?: string;
  separator?: string;
}

export const generateTopicTitle = (options: AutoSeoOptions): string => {
  const { topicTitle, categoryName, forumName = FORUM_NAME, separator = ' | ' } = options;
  
  if (!topicTitle) return forumName;
  
  if (categoryName) {
    return `${topicTitle}${separator}${forumName}${separator}${categoryName}`;
  }
  
  return `${topicTitle}${separator}${forumName}`;
};

export const generateCategoryTitle = (categoryName: string, forumName: string = FORUM_NAME, separator: string = ' | '): string => {
  if (!categoryName) return forumName;
  return `${categoryName}${separator}${forumName}`;
};

export const generateTopicDescription = (options: AutoSeoOptions): string => {
  const { topicTitle, categoryName, topicContent, forumName = FORUM_NAME } = options;
  
  // If we have content, extract the first 150 characters
  if (topicContent) {
    const textContent = htmlToText(topicContent);
    const excerpt = textContent.substring(0, 150).trim();
    if (excerpt.length > 0) {
      return excerpt.length < textContent.length ? `${excerpt}...` : excerpt;
    }
  }
  
  // Fallback description
  if (topicTitle && categoryName) {
    return `Join the discussion about ${topicTitle} in ${categoryName} on ${forumName}.`;
  }
  
  if (topicTitle) {
    return `Discuss ${topicTitle} with the ${forumName} community.`;
  }
  
  return `Join the discussion on ${forumName}.`;
};

export const generateCategoryDescription = (categoryName: string, forumName: string = FORUM_NAME): string => {
  if (!categoryName) return `Explore discussions on ${forumName}.`;
  return `Explore ${categoryName} topics and join the discussion on ${forumName}.`;
};

export const shouldUseAutoGeneration = (
  manualValue: string | null | undefined,
  autoGenerationEnabled: boolean = true
): boolean => {
  return autoGenerationEnabled && (!manualValue || manualValue.trim() === '');
};

export const truncateDescription = (description: string, maxLength: number = 160): string => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 1).trim() + '…';
};