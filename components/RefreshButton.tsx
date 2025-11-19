"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/sync/refresh", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the page to show updated data
        router.refresh();
      } else {
        alert(`Failed to refresh: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      alert("Failed to refresh. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRefreshing ? "🔄 Refreshing..." : "🔄 Refresh Stats"}
    </button>
  );
}

