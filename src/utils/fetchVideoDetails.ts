export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  baseDelayMs = 500
): Promise<Response> {
  let attempt = 0;
  let lastError: any;

  while (attempt < retries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      attempt++;

      // Exponential backoff: 0.5s, 1s, 2s, ...
      const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 200;
      console.warn(
        `[fetchWithRetry] Attempt ${attempt} failed (${err}). Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Fetch failed after ${retries} retries: ${lastError}`);
}

// Requires setting YOUTUBE_API_KEY in environment
export function detectYouTubeLinkType(
  url: string
): "video" | "shorts" | "channel" | "unknown" {
  if (!url) return "unknown";

  const normalized = url.toLowerCase();

  if (/\/shorts\//.test(normalized)) return "shorts";
  if (/watch\?v=|youtu\.be\/|\/embed\//.test(normalized)) return "video";
  if (/\/(channel\/|user\/|c\/|@)/.test(normalized)) return "channel";

  return "unknown";
}

const API_KEY = process.env.YOUTUBE_API_KEY;

export const fetchYouTubeDetails = async (url: string) => {
  if (!url?.includes("youtube.com") && !url?.includes("youtu.be")) {
    return {
      type: "unknown",
      title: "Invalid YouTube URL",
      thumbnail: "https://via.placeholder.com/320x180?text=Invalid+URL",
    };
  }

  try {
    const type = detectYouTubeLinkType(url);

    if (type === "video" || type === "shorts") {
      // ----------------------------
      // 🧠 Video / Shorts Logic
      // ----------------------------
      const oembedRes = await fetchWithRetry(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(
          url
        )}&format=json`
      );
      const oembed = await oembedRes.json();

      // Extract video ID
      const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      const videoId = videoIdMatch?.[1];
      if (!videoId) throw new Error("Could not parse video ID");

      // Fetch statistics
      const statsRes = await fetchWithRetry(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`
      );
      const statsJson = await statsRes.json();
      const stats = statsJson.items?.[0]?.statistics;

      return {
        type,
        title: oembed.title,
        thumbnail: oembed.thumbnail_url,
        viewCount: stats?.viewCount ?? null,
        likeCount: stats?.likeCount ?? null,
      };
    }

    if (type === "channel") {
      // ----------------------------
      // 🧠 Channel Logic
      // ----------------------------
      let channelId: string | null = null;

      // Try to extract channel ID or handle custom URLs
      const channelMatch = url.match(/\/channel\/([A-Za-z0-9_-]+)/);
      const handleMatch = url.match(/\/@(.*?)$/);
      const userMatch = url.match(/\/user\/([A-Za-z0-9_-]+)/);
      const cMatch = url.match(/\/c\/([A-Za-z0-9_-]+)/);

      if (channelMatch) {
        channelId = channelMatch[1];
      } else if (handleMatch) {
        const handle = handleMatch[1];
        const res = await fetchWithRetry(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forHandle=@${handle}&key=${API_KEY}`
        );
        const json = await res.json();
        channelId = json.items?.[0]?.id;
        if (!channelId) throw new Error("Could not resolve handle to channel");
        return {
          type,
          title: json.items[0].snippet.title,
          thumbnail: json.items[0].snippet.thumbnails.default.url,
          subscriberCount: json.items[0].statistics.subscriberCount,
        };
      } else if (userMatch || cMatch) {
        const username = userMatch?.[1] ?? cMatch?.[1];
        const res = await fetchWithRetry(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forUsername=${username}&key=${API_KEY}`
        );
        const json = await res.json();
        if (!json.items?.length) throw new Error("Invalid username");
        return {
          type,
          title: json.items[0].snippet.title,
          thumbnail: json.items[0].snippet.thumbnails.default.url,
          subscriberCount: json.items[0].statistics.subscriberCount,
        };
      }

      if (channelId) {
        const statsRes = await fetchWithRetry(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${API_KEY}`
        );
        const statsJson = await statsRes.json();
        const channel = statsJson.items?.[0];
        if (!channel) throw new Error("Channel not found");

        return {
          type,
          title: channel.snippet.title,
          thumbnail: channel.snippet.thumbnails.default.url,
          subscriberCount: channel.statistics.subscriberCount,
        };
      }

      throw new Error("Unable to resolve channel info");
    }

    return {
      type: "unknown",
      title: "Unsupported YouTube link",
      thumbnail: "https://via.placeholder.com/320x180?text=Unsupported",
    };
  } catch (error) {
    console.error("YouTube API Error:", error);
    return {
      type: "error",
      title: "Error fetching details",
      thumbnail: "https://via.placeholder.com/320x180?text=Error",
    };
  }
};

// Extract video ID from a URL (video, shorts, youtu.be)
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  const normalized = url.toLowerCase();

  // Shorts
  const shortsMatch = normalized.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Regular watch?v=
  const watchMatch = normalized.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Shortened youtu.be link
  const shortMatch = normalized.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  return null;
}

// Extract channel ID or username/handle
export function extractChannelIdOrHandle(url: string): string | null {
  const channelMatch = url.match(/\/channel\/([A-Za-z0-9_-]+)/);
  const handleMatch = url.match(/\/@([A-Za-z0-9_-]+)/);
  const userMatch = url.match(/\/user\/([A-Za-z0-9_-]+)/);
  const cMatch = url.match(/\/c\/([A-Za-z0-9_-]+)/);
  return (
    channelMatch?.[1] ??
    handleMatch?.[1] ??
    userMatch?.[1] ??
    cMatch?.[1] ??
    null
  );
}

// Batch fetch video stats
export async function fetchVideoStats(videoIds: string[]) {
  const chunks: string[][] = [];
  const chunkSize = 50; // max 50 per API call
  for (let i = 0; i < videoIds.length; i += chunkSize) {
    chunks.push(videoIds.slice(i, i + chunkSize));
  }

  const results: Record<string, { viewCount: number; likeCount: number }> = {};

  for (const chunk of chunks) {
    const res = await fetchWithRetry(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(
        ","
      )}&key=${API_KEY}`
    );
    const json = await res.json();
    console.log(json);
    json.items?.forEach((item: any) => {
      results[item.id] = {
        viewCount: Number(item.statistics.viewCount ?? 0),
        likeCount: Number(item.statistics.likeCount ?? 0),
      };
    });
  }

  return results;
}

// Batch fetch channel subscriber stats
export async function fetchChannelStats(channelIdsOrHandles: string[]) {
  const results: Record<string, number> = {};

  for (const idOrHandle of channelIdsOrHandles) {
    let url: string;
    if (/^[A-Za-z0-9_-]{24,}$/.test(idOrHandle)) {
      // looks like channel ID
      url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${idOrHandle}&key=${API_KEY}`;
    } else {
      // assume handle or username
      url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&forUsername=${idOrHandle}&key=${API_KEY}`;
    }

    try {
      const res = await fetchWithRetry(url);
      const json = await res.json();
      if (json.items?.length) {
        const stats = json.items[0].statistics;
        results[idOrHandle] = Number(stats.subscriberCount ?? 0);
      } else {
        results[idOrHandle] = 0;
      }
    } catch (err) {
      console.error(`Failed to fetch channel stats for ${idOrHandle}`, err);
      results[idOrHandle] = 0;
    }
  }

  return results;
}
