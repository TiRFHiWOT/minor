import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FixPattern {
  id: string;
  pattern_type: string;
  old_url: string;
  original_new_url: string;
  corrected_new_url: string;
  fix_reason: string;
  confidence_improvement?: number;
  created_at: string;
  created_by?: string;
  notes?: string;
}

export const useFixPatterns = () => {
  const [isLoading, setIsLoading] = useState(false);

  const recordFixPattern = async (
    patternType: string,
    oldUrl: string,
    originalNewUrl: string,
    correctedNewUrl: string,
    fixReason: string,
    confidenceImprovement?: number,
    notes?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('url_migration_fix_patterns')
        .insert({
          pattern_type: patternType,
          old_url: oldUrl,
          original_new_url: originalNewUrl,
          corrected_new_url: correctedNewUrl,
          fix_reason: fixReason,
          confidence_improvement: confidenceImprovement,
          notes: notes
        });

      if (error) {
        console.error('Error recording fix pattern:', error);
        throw error;
      }

      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const getFixPatterns = async (patternType?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('url_migration_fix_patterns')
        .select('*')
        .order('created_at', { ascending: false });

      if (patternType) {
        query = query.eq('pattern_type', patternType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching fix patterns:', error);
        throw error;
      }

      return data as FixPattern[];
    } finally {
      setIsLoading(false);
    }
  };

  const getFixPatternStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('url_migration_fix_patterns')
        .select('pattern_type, confidence_improvement')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fix pattern stats:', error);
        throw error;
      }

      // Calculate statistics
      const stats = data.reduce((acc, pattern) => {
        const type = pattern.pattern_type;
        if (!acc[type]) {
          acc[type] = { count: 0, totalImprovement: 0, avgImprovement: 0 };
        }
        acc[type].count++;
        if (pattern.confidence_improvement) {
          acc[type].totalImprovement += pattern.confidence_improvement;
        }
        acc[type].avgImprovement = acc[type].totalImprovement / acc[type].count;
        return acc;
      }, {} as Record<string, { count: number; totalImprovement: number; avgImprovement: number }>);

      return stats;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    recordFixPattern,
    getFixPatterns,
    getFixPatternStats,
    isLoading
  };
};