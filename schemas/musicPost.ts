import {defineType} from 'sanity'

export default defineType({
  name: 'musicPost',
  title: 'Music Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short description of the song/album',
    },
    {
      name: 'coverArt',
      title: 'Cover Art',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'releaseType',
      title: 'Release Type',
      type: 'string',
      options: {
        list: [
          {title: 'Single', value: 'single'},
          {title: 'EP', value: 'ep'},
          {title: 'Album', value: 'album'},
          {title: 'Demo', value: 'demo'},
        ],
      },
    },
    {
      name: 'tracks',
      title: 'Tracks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'trackNumber',
              title: 'Track Number',
              type: 'number',
              validation: (Rule) => Rule.required().positive(),
            },
            {
              name: 'trackTitle',
              title: 'Track Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'audioFile',
              title: 'Audio File',
              type: 'file',
              options: {
                accept: '.mp3,.wav,.m4a,.ogg',
              },
              validation: (Rule) => Rule.required(),
              description: 'Upload the audio file for this track',
            },
            {
              name: 'duration',
              title: 'Track Duration',
              type: 'string',
              description: 'Format: MM:SS (e.g., "3:42")',
            },
            {
              name: 'trackStreamingLinks',
              title: 'Track Streaming Links',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'platform',
                      title: 'Platform',
                      type: 'string',
                      options: {
                        list: [
                          {title: 'Spotify', value: 'spotify'},
                          {title: 'Apple Music', value: 'apple-music'},
                          {title: 'YouTube Music', value: 'youtube-music'},
                          {title: 'SoundCloud', value: 'soundcloud'},
                          {title: 'Bandcamp', value: 'bandcamp'},
                          {title: 'Other', value: 'other'},
                        ],
                      },
                    },
                    {
                      name: 'url',
                      title: 'URL',
                      type: 'url',
                    },
                  ],
                },
              ],
              description: 'Individual streaming links for this track',
            },
            {
              name: 'lyrics',
              title: 'Track Lyrics',
              type: 'object',
              fields: [
                {
                  name: 'lyricsData',
                  title: 'Lyrics Content',
                  type: 'text',
                  rows: 15,
                  description: `Add track lyrics in any of these supported formats:

• Simple Text Format:
[Verse 1]
Here we are now, entertain us
I feel stupid and contagious

• LRC (Synchronized) Format:
[00:12.34] Here we are now, entertain us
[00:15.67] I feel stupid and contagious

• JSON Format:
[{"time": "00:12.34", "text": "Here we are now, entertain us"}]

• SRT-style Format:
1
00:00:12,340 --> 00:00:15,670
Here we are now, entertain us

The system will automatically detect and parse the format.`,
                },
                {
                  name: 'lyricsFile',
                  title: 'Upload Lyrics File',
                  type: 'file',
                  options: {
                    accept: '.lrc,.txt,.json,.srt'
                  },
                  description: 'Alternatively, upload a lyrics file (.lrc, .txt, .json, or .srt)',
                },
                {
                  name: 'enableSync',
                  title: 'Enable Real-time Sync',
                  type: 'boolean',
                  description: 'Enable synchronized lyrics that highlight in real-time with music playback',
                  initialValue: true,
                },
                {
                  name: 'formatHint',
                  title: 'Format Hint (Optional)',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Auto-detect', value: 'auto'},
                      {title: 'Simple Text', value: 'text'},
                      {title: 'LRC (Synchronized)', value: 'lrc'},
                      {title: 'JSON', value: 'json'},
                      {title: 'SRT-style', value: 'srt'},
                    ],
                  },
                  initialValue: 'auto',
                  description: 'Help the parser by specifying the format if auto-detection fails',
                }
              ],
              description: 'Multi-format lyrics support. Add synchronized or static lyrics for this track. The system supports LRC, JSON, SRT, and simple text formats.',
            },
          ],
          preview: {
            select: {
              title: 'trackTitle',
              trackNumber: 'trackNumber',
            },
            prepare(selection) {
              const {title, trackNumber} = selection
              return {
                title: title,
                subtitle: `Track ${trackNumber}`,
              }
            },
          },
        },
      ],
      description: 'Add multiple tracks for EPs, albums, or collections',
    },
    {
      name: 'streamingLinks',
      title: 'Streaming Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  {title: 'Spotify', value: 'spotify'},
                  {title: 'Apple Music', value: 'apple-music'},
                  {title: 'YouTube Music', value: 'youtube-music'},
                  {title: 'SoundCloud', value: 'soundcloud'},
                  {title: 'Bandcamp', value: 'bandcamp'},
                  {title: 'Other', value: 'other'},
                ],
              },
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
            },
          ],
        },
      ],
    },
    {
      name: 'credits',
      title: 'Credits',
      type: 'text',
      rows: 4,
      description: 'Production credits, collaborators, etc.',
    },
    {
      name: 'body',
      title: 'Article Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
      description: 'Write about your creative process, inspiration, etc.',
    },
  ],
  preview: {
    select: {
      title: 'title',
      releaseType: 'releaseType',
      media: 'coverArt',
    },
    prepare(selection) {
      const {releaseType} = selection
      return {...selection, subtitle: releaseType && `${releaseType.toUpperCase()}`}
    },
  },
})