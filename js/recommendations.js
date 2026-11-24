/**
 * MindPulse AI - Music Recommendation Engine & Clinical Metadata Store
 * Maps facial emotions to therapeutic mood categories and queries YouTube API v3.
 */

class RecommendationEngine {
  constructor() {
    // Curated Sound Therapy YouTube Tracks Library
    this.tracks = [
      {
        id: 'track-1',
        youtubeId: 'UfcAVejslrU',
        title: 'Weightless Melodies (Ambient Soundscape)',
        artist: 'Marconi Union / MindPulse',
        duration: '3:30',
        mood: 'calm',
        emotion: 'neutral',
        category: 'neutral',
        coverUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=300&q=80',
        freq: '432 Hz',
        frequency: '432 Hz',
        tag: 'Relaxation',
        bpm: 60,
        clinicalReason: 'Promotes alpha wave entrainment and reduces autonomic nervous system stress.'
      },
      {
        id: 'track-2',
        title: 'Yiruma - River Flows in You',
        artist: 'Yiruma',
        duration: '4:15',
        mood: 'sad',
        emotion: 'sad',
        category: 'sad',
        youtubeId: '7maJOI3QMu0',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
        freq: '528 Hz',
        frequency: '528 Hz',
        tag: 'Comfort',
        bpm: 54,
        clinicalReason: 'Soothes sorrow and emotional fatigue through gentle acoustic harmonics.'
      },
      {
        id: 'track-3',
        title: 'Pharrell Williams - Happy',
        artist: 'Pharrell Williams',
        duration: '3:53',
        mood: 'happy',
        emotion: 'happy',
        category: 'happy',
        youtubeId: 'ZbZSe6N_BXs',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
        freq: '639 Hz',
        frequency: '639 Hz',
        tag: 'Joy & Energy',
        bpm: 160,
        clinicalReason: 'Enhances positive arousal and sustains healthy neurotransmitter activity.'
      },
      {
        id: 'track-4',
        title: 'Stress Relief Music - Yellow Brick Cinema',
        artist: 'Yellow Brick Cinema',
        duration: '5:00',
        mood: 'stressed',
        emotion: 'angry',
        category: 'angry',
        youtubeId: 'lFcSrYw-ARY',
        coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&q=80',
        freq: '396 Hz',
        frequency: '396 Hz',
        tag: 'Grounding',
        bpm: 50,
        clinicalReason: 'Reduces cortisol levels and muscle tension caused by frustration or stress.'
      },
      {
        id: 'track-5',
        title: '432Hz Miracle Tone - Anxiety Relief',
        artist: 'PowerThoughts Meditation',
        duration: '4:40',
        mood: 'anxious',
        emotion: 'fear',
        category: 'fear',
        youtubeId: '2OEL4P1Rz04',
        coverUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&q=80',
        freq: '174 Hz',
        frequency: '174 Hz',
        tag: 'Anti-Panic',
        bpm: 48,
        clinicalReason: 'Stimulates vagal nerve relaxation to slow heart rate and racing thoughts.'
      },
      {
        id: 'track-6',
        title: 'lofi hip hop beats to relax/study to',
        artist: 'Lofi Girl',
        duration: '3:55',
        mood: 'energetic',
        emotion: 'surprise',
        category: 'surprise',
        youtubeId: '5qap5aO4i9A',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
        freq: '852 Hz',
        frequency: '852 Hz',
        tag: 'Focus Flow',
        bpm: 85,
        clinicalReason: 'Channels mental alertness into sustained cognitive focus and concentration.'
      }
    ];

    // Emotion-to-Clinical Metadata Definition
    this.clinicalMetaMap = {
      happy: {
        emoji: '😊',
        rxHeadline: 'High Vitality & Joy Prescribed',
        rxExplanation: 'Your facial expressions reflect positive arousal. Uplifting acoustic harmonies will sustain your dopamine levels.',
        primaryTrackId: 'track-3'
      },
      sad: {
        emoji: '😔',
        rxHeadline: 'Cathartic Comfort & Warmth Prescribed',
        rxExplanation: 'Gentle piano melodies and 528Hz healing frequencies provide emotional comfort and soothe stress.',
        primaryTrackId: 'track-2'
      },
      angry: {
        emoji: '😡',
        rxHeadline: 'Grounding Cortisol Reduction Prescribed',
        rxExplanation: 'Calm intense emotions with 396Hz deep frequency sound baths designed to lower muscle tension.',
        primaryTrackId: 'track-4'
      },
      fear: {
        emoji: '😨',
        rxHeadline: 'Vagus Nerve Anxiety Reset Prescribed',
        rxExplanation: 'Slow down racing thoughts with 174Hz anti-anxiety soundscapes that stimulate vagus nerve relaxation.',
        primaryTrackId: 'track-5'
      },
      surprise: {
        emoji: '😲',
        rxHeadline: 'Focused Energy & Cognitive Flow Prescribed',
        rxExplanation: 'Channel high alertness into productive focus using steady rhythmic lo-fi beats.',
        primaryTrackId: 'track-6'
      },
      neutral: {
        emoji: '😐',
        rxHeadline: 'Alpha Wave Entrainment Prescribed',
        rxExplanation: 'Harmonize your mental state with peaceful 432Hz ambient instrumental soundscapes.',
        primaryTrackId: 'track-1'
      }
    };
  }

  getClinicalMeta(emotion) {
    const key = (emotion || 'neutral').toLowerCase();
    return this.clinicalMetaMap[key] || this.clinicalMetaMap.neutral;
  }

  getAllSongs() {
    return this.tracks;
  }

  getSongById(id) {
    if (this.latestRecommendations) {
      const matchLatest = this.latestRecommendations.find(t => t.id === id || t.youtubeId === id);
      if (matchLatest) return matchLatest;
    }
    return this.tracks.find(t => t.id === id || t.youtubeId === id) || this.tracks[0];
  }

  getSongsByEmotion(emotion, language = null) {
    const key = (emotion || 'all').toLowerCase();
    const lang = language || this.currentLanguage || (window.app && window.app.selectedLanguage);
    const langKey = lang ? lang.toLowerCase() : null;

    // If we have freshly fetched dynamic recommendations for this emotion and language, return them
    if (this.latestRecommendations && this.latestRecommendations.length > 0) {
      const first = this.latestRecommendations[0];
      const emotionMatches = (key === 'all' || first.emotion === key || first.mood === key || first.category === key);
      const langMatches = (!langKey || (first.language && first.language.toLowerCase() === langKey));
      if (emotionMatches && langMatches) {
        return this.latestRecommendations;
      }
    }

    if (!emotion || emotion === 'all') return this.tracks;
    const filtered = this.tracks.filter(t => t.category === key || t.mood === key || t.emotion === key);
    if (langKey) {
      const langFiltered = filtered.filter(t => t.language && t.language.toLowerCase() === langKey);
      if (langFiltered.length > 0) return langFiltered;
    }
    return filtered.length > 0 ? filtered : this.tracks;
  }

  searchTracks(query) {
    if (!query) return this.tracks;
    const q = query.toLowerCase();
    return this.tracks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.artist.toLowerCase().includes(q) ||
      t.mood.toLowerCase().includes(q) ||
      (t.language && t.language.toLowerCase().includes(q))
    );
  }

  // Dynamically fetch YouTube Recommendations for detected emotion and language from Flask backend
  async fetchYouTubeRecommendations(emotion, language = null) {
    const flaskUrl = (window.app && window.app.config.flaskUrl) || 'http://127.0.0.1:5000';
    const moodKey = (emotion || 'neutral').toLowerCase();
    const lang = language || this.currentLanguage || (window.app && window.app.selectedLanguage) || 'Hindi';
    this.currentLanguage = lang;

    try {
      const langParam = lang ? `&language=${encodeURIComponent(lang.toLowerCase())}` : '';
      const response = await fetch(`${flaskUrl}/api/recommendations?mood=${encodeURIComponent(moodKey)}&emotion=${encodeURIComponent(moodKey)}&limit=6${langParam}`, {
        credentials: 'include'
      });
      if (!response.ok) return this.getSongsByEmotion(moodKey, lang);

      const data = await response.json();
      if (data.success && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        const ytTracks = data.recommendations.map((v, index) => ({
          id: v.video_id || `yt-${moodKey}-${index}`,
          youtubeId: v.video_id,
          title: v.title,
          artist: v.channel || 'YouTube Music',
          duration: '3:45',
          mood: moodKey,
          emotion: moodKey,
          category: moodKey,
          language: lang,
          coverUrl: v.thumbnail || `https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`,
          freq: '432 Hz',
          frequency: '432 Hz',
          tag: `${lang} Therapy`,
          bpm: 72,
          clinicalReason: `Dynamic YouTube recommendation for detected ${moodKey.toUpperCase()} state in ${lang}.`
        }));

        this.latestRecommendations = ytTracks;

        // Update primary prescription track so "Play Prescribed Track" plays this language's recommendation
        if (this.clinicalMetaMap[moodKey] && ytTracks.length > 0) {
          this.clinicalMetaMap[moodKey].primaryTrackId = ytTracks[0].id;
        }

        // Merge into tracks cache
        ytTracks.forEach(yt => {
          const idx = this.tracks.findIndex(t => t.id === yt.id || t.youtubeId === yt.youtubeId);
          if (idx >= 0) {
            this.tracks[idx] = yt;
          } else {
            this.tracks.unshift(yt);
          }
        });

        return ytTracks;
      }
    } catch (e) {
      console.warn("YouTube recommendation API query failed, using offline YouTube catalog:", e);
    }

    return this.getSongsByEmotion(moodKey, lang);
  }
}

// Global instance attached to window
window.recommendationEngine = new RecommendationEngine();
