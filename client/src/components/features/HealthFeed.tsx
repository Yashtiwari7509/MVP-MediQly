import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Loader2, ExternalLink } from "lucide-react";

interface YouTubeSnippet {
  title: string;
  thumbnails: {
    medium: {
      url: string;
    };
  };
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: YouTubeSnippet;
}

interface Video {
  id: string;
  title: string;
}

export function HealthFeed() {
  const [videos, setVideos] = useLocalStorage<Video[]>("health-videos", []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHealthVideos = async () => {
    try {
      // Check if API key exists
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        setError("YouTube API key is missing. Please check your .env file.");
        return;
      }

      setLoading(true);
      setError("");
      
      const response = await axios.get<{ items: YouTubeVideo[] }>(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=health fitness wellness&type=video&key=${apiKey}&videoDuration=any`
      );

      // Check if response has items
      if (!response.data.items?.length) {
        setError("No videos found");
        return;
      }

      const newVideos = response.data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
      }));

      setVideos(newVideos);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Handle specific API errors
        const status = err.response?.status;
        if (status === 403) {
          setError("API key is invalid or quota exceeded");
        } else if (status === 400) {
          setError("Invalid request. Please check API parameters");
        } else {
          setError(`Failed to fetch videos: ${err.response?.data?.error?.message || err.message}`);
        }
      } else {
        setError("An unexpected error occurred");
      }
      console.error("YouTube API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videos.length === 0) {
      fetchHealthVideos();
    }
    
    // Refresh feed every 6 hours
    const interval = setInterval(fetchHealthVideos, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 space-y-2">
        <p>{error}</p>
        <button 
          onClick={fetchHealthVideos}
          className="text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-1">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => openVideo(video.id)}
            className="w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="truncate">{video.title}</span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
} 