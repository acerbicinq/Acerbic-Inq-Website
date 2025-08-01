import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Acerbic Inq',

  projectId: 'gcfgnt56',
  dataset: 'ai-website',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
