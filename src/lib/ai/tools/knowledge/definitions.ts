/**
 * Knowledge Tool Definitions
 *
 * Tool definitions for knowledge base search, content sources, hit list management,
 * and content analytics.
 */
import type { ToolDefinitions } from '../types';

export const knowledgeToolDefinitions: ToolDefinitions = [
  // search_knowledge
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description:
        'Search the knowledge base for documents, articles, FAQs, and other content. Use this when the user asks questions that might be answered by company documentation.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find relevant documents',
          },
          type: {
            type: 'string',
            enum: ['document', 'url', 'image', 'text'],
            description: 'Filter by content type',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 5)',
          },
        },
        required: ['query'],
      },
    },
  },

  // add_content_source
  {
    type: 'function',
    function: {
      name: 'add_content_source',
      description:
        'Add a research source or website to the Content Cockpit Sources Hub. Use when user mentions a useful website or resource for content research.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the source (e.g., "TechCrunch", "HubSpot Blog")',
          },
          url: {
            type: 'string',
            description: 'URL of the source website',
          },
          description: {
            type: 'string',
            description: 'Brief description of what this source covers',
          },
          type: {
            type: 'string',
            enum: ['news', 'research', 'competitor', 'inspiration', 'industry', 'other'],
            description: 'Type of content source',
          },
        },
        required: ['name', 'url'],
      },
    },
  },

  // add_to_hit_list
  {
    type: 'function',
    function: {
      name: 'add_to_hit_list',
      description:
        'Add a topic idea to the Article Hit List for content planning. Use when user wants to save an article idea or topic.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the article topic',
          },
          description: {
            type: 'string',
            description: 'Brief description of what the article should cover',
          },
          whyItWorks: {
            type: 'string',
            description: 'Explanation of why this topic is good for the audience',
          },
          category: {
            type: 'string',
            description: 'Content category (e.g., "Marketing", "Sales", "Product")',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Priority level for the topic',
          },
        },
        required: ['title'],
      },
    },
  },

  // get_hit_list_insights
  {
    type: 'function',
    function: {
      name: 'get_hit_list_insights',
      description:
        'Get insights about what article to write next based on the hit list priorities. Use when user asks what they should write about.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // reprioritize_hit_list
  {
    type: 'function',
    function: {
      name: 'reprioritize_hit_list',
      description:
        'Trigger AI reprioritization of hit list items based on current trends and content gaps. Use when user wants to reorder their content queue.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // get_article_analytics
  {
    type: 'function',
    function: {
      name: 'get_article_analytics',
      description: 'Get performance analytics for published articles. Use when user asks about content performance.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['7d', '30d', '90d'],
            description: 'Time period for analytics (default: 30d)',
          },
        },
      },
    },
  },

  // get_content_insights
  {
    type: 'function',
    function: {
      name: 'get_content_insights',
      description:
        'Get AI-powered content recommendations and suggestions. Use when user wants ideas for improving their content strategy.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // get_use_case_recommendation
  {
    type: 'function',
    function: {
      name: 'get_use_case_recommendation',
      description:
        'Find matching use cases based on a description. Use when user describes a customer type or scenario.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description of the customer type or scenario to match',
          },
        },
        required: ['description'],
      },
    },
  },

  // get_source_suggestions
  {
    type: 'function',
    function: {
      name: 'get_source_suggestions',
      description:
        'Get AI-discovered source suggestions for content research. Use when user wants to find new research sources.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];
