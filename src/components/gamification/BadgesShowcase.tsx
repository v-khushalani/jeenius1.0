import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Award, Trophy, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/utils/logger';

interface BadgeType {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  color: string;
  category: string;
  earned?: boolean;
  earned_at?: string;
}

const BadgesShowcase = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      setUserPoints(profile?.total_points || 0);

      const { data: allBadges } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });

      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', user.id);

      const badgeMap = userBadges?.reduce((acc: any, ub) => {
        acc[ub.badge_id] = ub.earned_at;
        return acc;
      }, {}) || {};

      const enrichedBadges = allBadges?.map(badge => ({
        ...badge,
        earned: !!badgeMap[badge.id],
        earned_at: badgeMap[badge.id]
      })) || [];

      setBadges(enrichedBadges);
    } catch (error) {
      logger.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons: any = {
    achievement: Trophy,
    skill: Star,
    subject: Award,
    streak: Award
  };

  const colorClasses: any = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    gold: 'from-yellow-400 to-yellow-600'
  };

  const categories = Array.from(new Set(badges.map(b => b.category)));

  if (loading) return <Card className="p-8 text-center">Loading badges...</Card>;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-600" />
            Your Badge Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map(category => {
              const categoryBadges = badges.filter(b => b.category === category);
              const CategoryIcon = categoryIcons[category];
              const earnedCount = categoryBadges.filter(b => b.earned).length;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="w-5 h-5 text-gray-700" />
                      <h3 className="font-bold text-gray-800 capitalize">{category}</h3>
                    </div>
                    <Badge variant="secondary">{earnedCount}/{categoryBadges.length}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {categoryBadges.map(badge => {
                      const progress = Math.min(100, (userPoints / badge.points_required) * 100);
                      
                      return (
                        <div key={badge.id} className="relative group">
                          <div className={`p-4 rounded-xl border-2 transition-all ${
                            badge.earned
                              ? `bg-gradient-to-br ${colorClasses[badge.color]} border-white shadow-lg scale-105`
                              : 'bg-gray-100 border-gray-300 opacity-60'
                          }`}>
                            <div className="text-center space-y-2">
                              <div className={`text-4xl ${badge.earned ? '' : 'grayscale'}`}>
                                {badge.icon}
                              </div>
                              <p className={`text-xs font-bold ${badge.earned ? 'text-white' : 'text-gray-600'}`}>
                                {badge.name}
                              </p>
                              {!badge.earned && (
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-1" />
                                  <p className="text-[10px] text-gray-500">
                                    {badge.points_required} pts
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {!badge.earned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-[2px]">
                              <Lock className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          
                          <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-gray-300">{badge.description}</p>
                            {badge.earned && badge.earned_at && (
                              <p className="text-green-400 mt-1">
                                ✓ Earned {new Date(badge.earned_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgesShowcase;
