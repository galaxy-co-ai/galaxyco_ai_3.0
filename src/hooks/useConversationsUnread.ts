"use client";

import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return { totalUnread: 0 };
  return res.json();
};

export function useConversationsUnread() {
  const { data } = useSWR<{ totalUnread: number }>(
    "/api/conversations/unread",
    fetcher,
    { 
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
    }
  );

  return data?.totalUnread || 0;
}
