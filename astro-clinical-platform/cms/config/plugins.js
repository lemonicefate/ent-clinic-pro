module.exports = ({ env }) => ({
  // 國際化插件
  i18n: {
    enabled: true,
    config: {
      locales: [
        {
          code: 'zh-TW',
          name: '繁體中文',
          isDefault: true,
        },
        {
          code: 'en',
          name: 'English',
        },
        {
          code: 'ja',
          name: '日本語',
        },
      ],
    },
  },
  
  // 檔案上傳插件
  upload: {
    enabled: true,
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 10000000, // 10MB
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
      // 醫療圖片優化設定
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
    },
  },

  // GraphQL 插件（可選）
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
      },
    },
  },

  // API 文件插件
  documentation: {
    enabled: true,
    config: {
      restrictedAccess: true,
      password: env('DOCS_PASSWORD', 'medical-docs-2024'),
      // 醫療 API 文件設定
      info: {
        version: '1.0.0',
        title: 'Astro Clinical Platform API',
        description: 'API documentation for medical content management',
        contact: {
          name: 'Medical Platform Team',
          email: 'dev@your-domain.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: env('API_URL', 'http://localhost:1337/api'),
          description: 'Development server',
        },
        {
          url: env('PRODUCTION_API_URL', 'https://cms.astro-clinical-platform.com/api'),
          description: 'Production server',
        },
      ],
      externalDocs: {
        description: 'Find more info here',
        url: 'https://docs.astro-clinical-platform.com',
      },
    },
  },

  // 使用者權限插件
  'users-permissions': {
    enabled: true,
    config: {
      jwt: {
        expiresIn: '7d',
      },
      // 醫療平台角色設定
      roles: {
        public: {
          description: 'Default role given to unauthenticated user.',
          permissions: {
            'api::calculator.calculator': ['find', 'findOne'],
            'api::education.education': ['find', 'findOne'],
            'api::flowchart.flowchart': ['find', 'findOne'],
          },
        },
        authenticated: {
          description: 'Default role given to authenticated user.',
          permissions: {
            'api::calculator.calculator': ['find', 'findOne'],
            'api::education.education': ['find', 'findOne'],
            'api::flowchart.flowchart': ['find', 'findOne'],
          },
        },
        medical_professional: {
          description: 'Role for verified medical professionals.',
          permissions: {
            'api::calculator.calculator': ['find', 'findOne', 'create', 'update'],
            'api::education.education': ['find', 'findOne', 'create', 'update'],
            'api::flowchart.flowchart': ['find', 'findOne', 'create', 'update'],
          },
        },
        content_manager: {
          description: 'Role for content management team.',
          permissions: {
            'api::calculator.calculator': ['find', 'findOne', 'create', 'update', 'delete'],
            'api::education.education': ['find', 'findOne', 'create', 'update', 'delete'],
            'api::flowchart.flowchart': ['find', 'findOne', 'create', 'update', 'delete'],
          },
        },
      },
    },
  },
});