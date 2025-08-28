import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CookieSettingsButton } from '@/components/cookies/CookieSettingsButton';
import { Shield, BarChart3, Globe, Clock, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            We believe in transparency. Here's exactly what we collect and why.
          </p>
          <Badge variant="secondary" className="text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Manage Your Cookie Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Change your cookie settings anytime
                </p>
              </div>
              <CookieSettingsButton />
            </div>
          </CardContent>
        </Card>

        {/* What We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              What We Track (With Your Permission)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">📊 Page Views & Navigation</h4>
                <p className="text-sm text-muted-foreground">
                  We track which pages you visit and how you navigate our site to understand what content is most valuable.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🔍 Search Activity</h4>
                <p className="text-sm text-muted-foreground">
                  When you search our forum, we track search terms and results to improve our search functionality.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">✏️ Content Creation</h4>
                <p className="text-sm text-muted-foreground">
                  We track when you create topics or posts to understand community engagement patterns.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">👤 User Actions</h4>
                <p className="text-sm text-muted-foreground">
                  Login, logout, and registration events help us understand user engagement and improve our platform.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">⚡ Performance Metrics</h4>
                <p className="text-sm text-muted-foreground">
                  Page load times and technical performance data help us keep the site fast and reliable.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🐛 Error Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  When something goes wrong, we track errors to fix bugs and improve your experience.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Why We Collect This Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium text-green-600">✨ Improve Your Experience</h4>
                <p className="text-sm text-muted-foreground">
                  Understanding how you use our site helps us make it better, faster, and more useful.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-600">📈 Understand Our Community</h4>
                <p className="text-sm text-muted-foreground">
                  Knowing which topics are popular helps us focus on what matters most to our users.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-purple-600">🔧 Fix Problems</h4>
                <p className="text-sm text-muted-foreground">
                  Error tracking helps us identify and fix issues before they affect more users.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-orange-600">🚀 Optimize Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Performance data helps us keep the site fast and responsive for everyone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Third Party Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Third Party Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Google Analytics</h4>
              <p className="text-sm text-muted-foreground mb-2">
                We use Google Analytics to understand site usage. Google may collect additional data as described in their privacy policy.
              </p>
              <a 
                href="https://policies.google.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Google's Privacy Policy →
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              How Long We Keep Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium">Analytics Data</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically deleted after 26 months as per Google Analytics default settings.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Cookie Preferences</h4>
                <p className="text-sm text-muted-foreground">
                  Stored locally in your browser for 1 year, then you'll be asked again.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Error Logs</h4>
                <p className="text-sm text-muted-foreground">
                  Technical error logs are kept for 90 days for debugging purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Rights & Choices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium">🚫 Opt Out Anytime</h4>
                <p className="text-sm text-muted-foreground">
                  Use the cookie settings button above to change your preferences at any time.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">🗑️ Delete Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Contact us to request deletion of any data we have about you.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">📋 Access Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Request a copy of any personal data we have collected about you.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">✏️ Correct Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Ask us to correct any inaccurate information we have about you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Questions or Concerns?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We're here to help! If you have any questions about this privacy policy or how we handle your data:
            </p>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Email:</strong> privacy@yourforum.com
              </p>
              <p className="text-sm">
                <strong>Response time:</strong> We aim to respond within 48 hours
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What We Don't Do */}
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              What We DON'T Do
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-green-700 dark:text-green-300">
              ❌ We don't sell your data to third parties<br/>
              ❌ We don't track you across other websites<br/>
              ❌ We don't collect personal information without permission<br/>
              ❌ We don't share data with advertisers<br/>
              ❌ We don't use data for marketing outside our platform
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;