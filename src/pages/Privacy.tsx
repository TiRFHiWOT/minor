import React from "react";
import { InlineContentEditor } from "@/components/admin/InlineContentEditor";

const Privacy = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      {" "}
      {/* Added a container div for consistent padding */}
      <InlineContentEditor
        settingKey="privacy_content"
        title="Privacy Policy"
        defaultContent=""
      />
      {/* AdMetricsPro CMP Privacy Policy Div */}
      {/* This div provides a link for users to adjust their consent settings */}
      <div
        id="ampCMP_privacyPolicy"
        className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800"
      >
        <p className="font-semibold">Privacy Settings:</p>
        <p className="text-sm">
          Click here to review and adjust your consent preferences for
          advertising and data collection.
        </p>
        {/* The AdMetricsPro script will likely inject a clickable link/button here */}
      </div>
    </div>
  );
};

export default Privacy;
