import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

export const useCanMoveTopic = () => {
  const { user } = useAuth();
  const { canModerate } = usePermissions();

  const canMoveTopic = (topic: any) => {
    if (!user) return false;
    
    // Admins and moderators can move any topic
    if (canModerate) return true;
    
    // Topic authors can move their own topics
    if (topic.author_id === user.id) return true;
    
    return false;
  };

  return { canMoveTopic };
};