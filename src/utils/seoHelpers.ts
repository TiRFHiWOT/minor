import { htmlToText } from '@/utils/htmlToText';

export const FORUM_NAME = 'Minor Hockey Forum';

export interface AutoSeoOptions {
  topicTitle?: string;
  categoryName?: string;
  topicContent?: string;
  useAutoGeneration?: boolean;
}

export const generateTopicTitle = (options: AutoSeoOptions): string => {
  const { topicTitle, categoryName } = options;
  
  if (!topicTitle) return FORUM_NAME;
  
  if (categoryName) {
    return `${topicTitle} | ${FORUM_NAME} | ${categoryName}`;
  }
  
  return `${topicTitle} | ${FORUM_NAME}`;
};

export const generateCategoryTitle = (categoryName: string): string => {
  if (!categoryName) return FORUM_NAME;
  return `${categoryName} | ${FORUM_NAME}`;
};

export const generateTopicDescription = (options: AutoSeoOptions): string => {
  const { topicTitle, categoryName, topicContent } = options;
  
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
    return `Join the discussion about ${topicTitle} in ${categoryName} on ${FORUM_NAME}.`;
  }
  
  if (topicTitle) {
    return `Discuss ${topicTitle} with the ${FORUM_NAME} community.`;
  }
  
  return `Join the discussion on ${FORUM_NAME}.`;
};

export const generateCategoryDescription = (categoryName: string): string => {
  if (!categoryName) return `Explore discussions on ${FORUM_NAME}.`;
  return `Explore ${categoryName} topics and join the discussion on ${FORUM_NAME}.`;
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