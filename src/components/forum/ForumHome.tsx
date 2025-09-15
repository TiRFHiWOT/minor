import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useTopics } from "@/hooks/useTopics";
import { useCategories } from "@/hooks/useCategories";
import { useForumSettings } from "@/hooks/useForumSettings";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TopicTable } from "./TopicTable";
import { ReportModal } from "./ReportModal";
import { BannerAd } from "../ads/BannerAd";

export const ForumHome = () => {
  const { getSetting } = useForumSettings();
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    topicId?: string;
  }>({
    isOpen: false,
  });

  // Pagination state for new topics
  const [newPage, setNewPage] = useState(1);

  // Paginated data hooks - only new topics
  const { data: newTopicsData, isLoading: newTopicsLoading } = useTopics(
    undefined,
    newPage,
    10,
    "last_reply_at"
  );

  const { data: level1Forums } = useCategories(null, 1); // Only Level 1 forums
  const { data: level2Forums } = useCategories(undefined, 2); // Province/State forums

  const handleReport = (topicId: string) => {
    setReportModal({
      isOpen: true,
      topicId,
    });
  };

  return (
    <div className="forum-spacing relative w-full overflow-x-hidden max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getSetting("forum_name", "Minor Hockey Talks")}
        </h1>
        <p className="text-muted-foreground">
          {getSetting(
            "forum_description",
            "A community forum for minor hockey discussions"
          )}
        </p>
      </div>

      {/* Banner Ad Above Tabs */}
      <BannerAd
        id="home-banner-ad"
        mobileUnitPath="/21849154601,423899568/Ad.Plus-Mobile-Banner"
        desktopUnitPath="/21849154601,423899568/Ad.Plus-Desktop-Banner"
      />

      {/* New Topics Section */}
      <div className="forum-spacing">
        <TopicTable
          topics={
            newTopicsData?.data?.map((topic) => ({
              ...topic,
              username: topic.profiles?.username || null,
              avatar_url: topic.profiles?.avatar_url || null,
              category_name: topic.categories?.name || "General",
              category_color: topic.categories?.color || "#3b82f6",
              category_slug: topic.categories?.slug || "",
              slug: topic.slug,
              hot_score: 0,
              last_post_id: topic.last_post_id,
              parent_category_id: topic.categories?.parent_category_id || null,
              parent_category_slug: null,
              last_reply_username: topic.last_reply_username,
              last_reply_avatar: topic.last_reply_avatar,
            })) || []
          }
          loading={newTopicsLoading}
          showCategory={true}
        />
        {newTopicsData && newTopicsData.data.length > 0 && (
          <PaginationControls
            currentPage={newPage}
            totalPages={newTopicsData.totalPages}
            totalItems={newTopicsData.totalCount}
            itemsPerPage={10}
            onPageChange={setNewPage}
            loading={newTopicsLoading}
          />
        )}
      </div>

      {/* Forums Section */}
      <div className="forum-spacing">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Browse Main Forums
          </h2>
        </div>

        <div
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          style={{ minHeight: "200px" }}
        >
          {level1Forums?.map((forum) => (
            <Link
              key={forum.id}
              to={`/category/${forum.slug}`}
              className="block"
            >
              <Card
                className="p-3 hover:bg-forum-row-hover transition-colors cursor-pointer border border-forum-border-subtle"
                style={{ minHeight: "80px" }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: forum.color }}
                  />
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">
                    {forum.name}
                  </h3>
                </div>
                {forum.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {forum.description}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>

        {(!level1Forums || level1Forums.length === 0) && (
          <Card className="p-6 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-2">
              No forums available
            </h3>
            <p className="text-muted-foreground text-sm">
              Forums will appear here once they are created.
            </p>
          </Card>
        )}
      </div>

      {/* Province/State Forums Section */}
      <div className="forum-spacing">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Browse Province / State Forums
          </h2>
        </div>

        {level2Forums && level2Forums.length > 0 ? (
          <div className="forum-spacing">
            {(() => {
              // Filter out tournament forums and group by country using parent_category_id
              const canadianForums = level2Forums
                .filter(
                  (forum) =>
                    forum.parent_category_id ===
                    "11111111-1111-1111-1111-111111111111"
                )
                .sort((a, b) => (a.region || "").localeCompare(b.region || ""));

              const usaForums = level2Forums
                .filter(
                  (forum) =>
                    forum.parent_category_id ===
                    "22222222-2222-2222-2222-222222222222"
                )
                .sort((a, b) => (a.region || "").localeCompare(b.region || ""));

              const countries = [];
              if (canadianForums.length > 0) {
                countries.push({ name: "Canada", forums: canadianForums });
              }
              if (usaForums.length > 0) {
                countries.push({ name: "USA", forums: usaForums });
              }

              return countries.map((country, index) => (
                <div key={country.name}>
                  <div className="forum-spacing">
                    <h3 className="text-base font-semibold text-foreground border-b pb-1 forum-header">
                      {country.name}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {country.forums.map((forum) => (
                        <Link
                          key={forum.id}
                          to={`/category/${forum.slug}`}
                          className="block"
                        >
                          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-2 mb-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: forum.color }}
                              />
                              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {forum.name}
                              </h4>
                            </div>
                            {forum.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {forum.description}
                              </p>
                            )}
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                  {index === 0 && <div></div>}
                </div>
              ));
            })()}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No province/state forums available
            </h3>
            <p className="text-muted-foreground">
              Province and state forums will appear here once they are created.
            </p>
          </Card>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
        topicId={reportModal.topicId}
        contentType="topic"
      />
    </div>
  );
};
