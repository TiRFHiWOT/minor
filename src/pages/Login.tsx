
import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AdBanner } from '@/components/ads/AdBanner';
import { LeaderboardTopAd } from '@/components/ads/LeaderboardTopAd';

const Login = () => {
  return (
    <>
      <LeaderboardTopAd />
      <LoginForm />
      <AdBanner />
    </>
  );
};

export default Login;
