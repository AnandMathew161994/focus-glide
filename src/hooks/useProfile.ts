import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function useProfile() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      createOrFetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const createOrFetchProfile = async () => {
    if (!user) return;

    try {
      // Set the user context for RLS policies by calling a function that sets the user ID
      await supabase.rpc('set_claim', { claim: 'sub', value: user.id });
      
      // First try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data && !error) {
        // Profile doesn't exist, create it
        const newProfile = {
          user_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          role: 'user'
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(createdProfile);
        }
      } else if (data) {
        setProfile(data);
      } else if (error) {
        console.error('Error fetching profile:', error);
      }
    } catch (error) {
      console.error('Error with profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, refetch: createOrFetchProfile };
}