async function fetchWithRetry(
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

// export const fetchVideoDetailsYoutube = async (url: string) => {
//   if (!url?.includes("youtube.com") && !url?.includes("youtu.be")) {
//     return {
//       videoTitle: "Invalid YouTube URL",
//       videoThumbnail: "https://via.placeholder.com/320x180?text=Invalid+URL",
//       viewCount: null,
//       likeCount: null,
//       subscriberCount: null,
//     };
//   }

//   try {
//     // First, fetch oEmbed for title and thumbnail
//     const oembedRes = await fetch(
//       `https://www.youtube.com/oembed?url=${encodeURIComponent(
//         url
//       )}&format=json`
//     );
//     if (!oembedRes.ok) throw new Error("oEmbed fetch failed");
//     const oembed = await oembedRes.json();

//     // Extract video ID from URL
//     const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
//     const videoId = videoIdMatch?.[1];
//     if (!videoId) throw new Error("Can’t parse video ID");

//     // Fetch statistics
//     const statsRes = await fetch(
//       `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`
//     );
//     if (!statsRes.ok) throw new Error("Stats fetch failed");
//     const statsJson = await statsRes.json();
//     const stats = statsJson.items?.[0]?.statistics;

//     return {
//       videoTitle: oembed.title,
//       videoThumbnail: oembed.thumbnail_url,
//       viewCount: stats?.viewCount ?? null,
//       likeCount: stats?.likeCount ?? null,
//     };
//   } catch (error) {
//     console.error(error);
//     return {
//       videoTitle: "Error fetching video",
//       videoThumbnail: "https://via.placeholder.com/320x180?text=Error",
//       viewCount: null,
//       likeCount: null,
//     };
//   }
// };
