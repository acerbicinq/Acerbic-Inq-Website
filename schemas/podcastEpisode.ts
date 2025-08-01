import {defineType} from 'sanity'

export default defineType({
  name: 'podcastEpisode',
  title: 'Podcast Episode',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Episode Title',
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
      name: 'episodeNumber',
      title: 'Episode Number',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Brief description of the episode',
    },
    {
      name: 'coverArt',
      title: 'Episode Cover Art',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Episode cover art',
    },
    {
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: {
        accept: '.mp3,.wav,.m4a,.ogg',
      },
      description: 'Upload your podcast episode audio file',
    },
    {
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      options: {
        accept: '.mp4,.mov,.avi,.mkv',
      },
      description: 'Upload your podcast episode video file (optional)',
    },
    {
      name: 'duration',
      title: 'Total Duration',
      type: 'string',
      description: 'Episode length (e.g., "45:30")',
    },
    {
      name: 'guest',
      title: 'Guest',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Guest Name',
          type: 'string',
        },
        {
          name: 'bio',
          title: 'Guest Bio',
          type: 'text',
          rows: 3,
        },
        {
          name: 'website',
          title: 'Guest Website',
          type: 'url',
        },
        {
          name: 'social',
          title: 'Social Links',
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
                      {title: 'Twitter', value: 'twitter'},
                      {title: 'Instagram', value: 'instagram'},
                      {title: 'LinkedIn', value: 'linkedin'},
                      {title: 'YouTube', value: 'youtube'},
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
      ],
    },
    {
      name: 'chapters',
      title: 'Chapters',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Chapter Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'startTime',
              title: 'Start Time',
              type: 'string',
              description: 'Format: MM:SS or HH:MM:SS',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'endTime',
              title: 'End Time',
              type: 'string',
              description: 'Format: MM:SS or HH:MM:SS',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Chapter Description',
              type: 'text',
              rows: 2,
            },
            {
              name: 'interludeTracks',
              title: 'Interlude Music Tracks',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'songTitle',
                      title: 'Song Title',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'artist',
                      title: 'Artist',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'album',
                      title: 'Album',
                      type: 'string',
                    },
                    {
                      name: 'streamingLinks',
                      title: 'Streaming Platform Links',
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
                                  {title: 'Tidal', value: 'tidal'},
                                  {title: 'Amazon Music', value: 'amazon-music'},
                                  {title: 'Deezer', value: 'deezer'},
                                  {title: 'SoundCloud', value: 'soundcloud'},
                                  {title: 'Bandcamp', value: 'bandcamp'},
                                ],
                              },
                              validation: (Rule) => Rule.required(),
                            },
                            {
                              name: 'url',
                              title: 'URL',
                              type: 'url',
                              validation: (Rule) => Rule.required(),
                            },
                            {
                              name: 'embedCode',
                              title: 'Embed Code',
                              type: 'text',
                              description: 'Optional embed code for this platform',
                            },
                          ],
                        },
                      ],
                      validation: (Rule) => Rule.min(1),
                    },
                    {
                      name: 'duration',
                      title: 'Song Duration',
                      type: 'string',
                      description: 'Format: MM:SS',
                    },
                    {
                      name: 'coverArt',
                      title: 'Song Cover Art',
                      type: 'image',
                      options: {
                        hotspot: true,
                      },
                    },
                    {
                      name: 'fallbackAudio',
                      title: 'Fallback Audio File',
                      type: 'file',
                      description: 'Self-hosted audio clip as fallback when streaming embeds are not available',
                      options: {
                        accept: '.mp3,.wav,.m4a,.ogg',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Topics covered in this episode',
    },
    {
      name: 'showNotes',
      title: 'Show Notes',
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
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: {hotspot: true},
        },
      ],
      description: 'Detailed show notes, links, and references',
    },
    {
      name: 'radioSettings',
      title: 'Radio Experience Settings',
      type: 'object',
      fields: [
        {
          name: 'enableMusicInterludes',
          title: 'Enable Music Interludes by Default',
          type: 'boolean',
          initialValue: true,
          description: 'Should music interludes be enabled by default for visitors?',
        },
        {
          name: 'allowUserToggle',
          title: 'Allow User to Toggle Interludes',
          type: 'boolean',
          initialValue: true,
          description: 'Can users turn off music interludes?',
        },
        {
          name: 'defaultStreamingPlatform',
          title: 'Default Streaming Platform',
          type: 'string',
          options: {
            list: [
              {title: 'Spotify', value: 'spotify'},
              {title: 'Apple Music', value: 'apple-music'},
              {title: 'YouTube Music', value: 'youtube-music'},
              {title: 'Tidal', value: 'tidal'},
            ],
          },
          initialValue: 'spotify',
        },
        {
          name: 'interludeVolume',
          title: 'Interlude Volume',
          type: 'number',
          description: 'Default volume for interlude music (0-100)',
          initialValue: 80,
          validation: (Rule) => Rule.min(0).max(100),
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      episodeNumber: 'episodeNumber',
      media: 'coverArt',
    },
    prepare(selection) {
      const {episodeNumber} = selection
      return {...selection, subtitle: episodeNumber && `Episode ${episodeNumber}`}
    },
  },
})