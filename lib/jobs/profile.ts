export type JobCategory =
  | 'all'
  | 'development'
  | 'automation'
  | 'email'
  | 'website'
  | 'design'
  | 'content'

export type TargetJobCategory = Exclude<JobCategory, 'all'>

export const jobCategories: { id: JobCategory; label: string }[] = [
  { id: 'all', label: 'All priority searches' },
  { id: 'development', label: 'Full-stack & frontend' },
  { id: 'automation', label: 'AI & business automation' },
  { id: 'email', label: 'Email & Klaviyo' },
  { id: 'website', label: 'Websites & e-commerce' },
  { id: 'design', label: 'Design & landing pages' },
  { id: 'content', label: 'Specialist writing' },
]

export const targetJobCategories: { id: TargetJobCategory; label: string }[] = [
  { id: 'development', label: 'Full-stack & frontend' },
  { id: 'automation', label: 'AI & business automation' },
  { id: 'email', label: 'Email & Klaviyo' },
  { id: 'website', label: 'Websites & e-commerce' },
  { id: 'design', label: 'Design & landing pages' },
  { id: 'content', label: 'Specialist writing' },
]

type SearchLane = {
  id: TargetJobCategory
  titleRolePhrases: string[]
  titleRoleWords: string[]
  detailRolePhrases: string[]
  skillPhrases: string[]
}

const searchLanes: SearchLane[] = [
  {
    id: 'development',
    titleRolePhrases: [
      'full stack developer', 'fullstack developer', 'full stack engineer', 'fullstack engineer',
      'full stack web developer', 'frontend developer', 'front end developer', 'frontend engineer', 'front end engineer',
      'web developer', 'website developer', 'web application developer',
      'react developer', 'react frontend developer', 'react engineer',
      'next js developer', 'next js website developer', 'next js engineer',
      'typescript developer', 'supabase developer', 'mvp developer', 'saas developer',
      'dashboard developer', 'admin panel developer', 'edtech developer', 'ecommerce developer',
      'e commerce developer', 'api integration developer', 'web app maintenance',
      'web application maintenance', 'website performance optimisation', 'website performance optimization',
      'website bug fixes', 'website maintenance',
      'website designer and developer',
      'figma to code', 'frontend implementation', 'responsive ui implementation',
      'figma to react', 'figma to next js', 'responsive web design',
    ],
    titleRoleWords: ['developer', 'engineer'],
    detailRolePhrases: [
      'full stack development', 'frontend development', 'front end development',
      'web application development', 'web app development', 'build web applications',
      'building web applications', 'build web apps', 'building web apps',
      'implement responsive interfaces', 'turn figma designs into code',
      'figma to code', 'third party api integration',
      'admin panel development', 'dashboard development', 'edtech platform development',
      'website performance optimisation', 'website performance optimization',
      'website bug fixes', 'web app maintenance', 'website maintenance',
      'figma to react', 'figma to next js', 'responsive web design',
    ],
    skillPhrases: [
      'react', 'react js', 'next js', 'nextjs', 'typescript', 'supabase',
      'tailwind css', 'figma to code', 'responsive frontend', 'responsive ui',
      'api integration', 'web application', 'web app', 'full stack development',
      'admin panel', 'dashboard', 'edtech', 'mvp', 'saas', 'web app maintenance',
      'website maintenance', 'website performance', 'website bug fixes',
      'figma to react', 'figma to next js', 'responsive web design',
      'ecommerce', 'e commerce',
    ],
  },
  {
    id: 'automation',
    titleRolePhrases: [
      'ai integration developer', 'ai automation developer', 'automation developer',
      'workflow automation specialist', 'crm automation specialist', 'automation consultant',
      'marketing automation specialist', 'webhook integration developer',
      'webhook integration specialist', 'business automation specialist',
      'crm integration specialist', 'ai integration specialist',
      'automation engineer', 'integration engineer', 'workflow engineer',
      'abandoned cart automation', 'welcome flow setup',
      'customer retention automation', 'email deliverability specialist',
      'esp migration specialist',
    ],
    titleRoleWords: ['automation', 'integration', 'workflow', 'crm'],
    detailRolePhrases: [
      'business process automation', 'automate business workflows',
      'automating business workflows', 'workflow automation',
      'crm integration', 'lead capture automation', 'follow up automation',
      'webhook integration', 'connect third party apis', 'ai integration',
      'abandoned cart automation', 'welcome flow setup',
      'customer retention automation', 'email deliverability',
      'esp migration',
    ],
    skillPhrases: [
      'api integration', 'webhook', 'crm', 'lead capture', 'workflow automation',
      'business automation', 'openai', 'llm integration', 'third party apis', 'ai integration',
      'abandoned cart automation', 'welcome flow setup',
      'customer retention automation', 'email deliverability',
      'esp migration',
    ],
  },
  {
    id: 'email',
    titleRolePhrases: [
      'klaviyo specialist', 'klaviyo email', 'email automation specialist',
      'email marketing designer', 'email designer', 'email copywriter',
      'email lifecycle specialist', 'email marketing specialist',
      'klaviyo flow specialist', 'email flows specialist', 'email campaign designer',
      'klaviyo developer', 'klaviyo flow builder', 'email template developer',
      'ecommerce email marketing', 'e commerce email marketing',
      'figma email campaign designer', 'email marketing copywriter',
      'lifecycle marketing specialist', 'abandoned cart automation',
      'welcome flow setup', 'customer retention automation',
      'email deliverability specialist', 'esp migration specialist',
    ],
    titleRoleWords: ['email', 'klaviyo', 'lifecycle', 'retention'],
    detailRolePhrases: [
      'email marketing design', 'email campaign design', 'email automation',
      'email lifecycle automation', 'email flow production', 'email copywriting',
      'ecommerce email marketing', 'e commerce email marketing',
      'abandoned cart automation', 'welcome flow setup',
      'customer retention automation', 'email deliverability',
      'esp migration', 'email template development', 'email marketing',
    ],
    skillPhrases: [
      'klaviyo', 'email design', 'figma email', 'email template',
      'abandoned cart', 'welcome flow', 'welcome sequence', 'email lifecycle',
      'email campaign', 'email copywriting', 'email automation',
      'lifecycle marketing',
      'abandoned cart automation', 'welcome flow setup',
      'customer retention automation', 'email deliverability',
      'esp migration', 'email template development', 'email marketing',
    ],
  },
  {
    id: 'website',
    titleRolePhrases: [
      'wordpress developer', 'wordpress website maintenance', 'wordpress maintenance',
      'wordpress support specialist', 'woocommerce developer', 'woocommerce store setup',
      'wordpress website designer',
      'ecommerce website developer', 'e commerce website developer',
      'online store developer', 'landing page developer', 'wordpress support',
      'woocommerce specialist', 'website maintenance specialist',
      'web app maintenance specialist', 'conversion focused landing page developer',
      'website developer', 'ecommerce developer', 'e commerce developer',
      'webflow developer', 'website performance optimisation', 'website performance optimization',
      'website bug fixes',
      'landing page redesign', 'conversion focused landing pages',
      'website designer and developer', 'website redesign specialist',
      'marketing website developer', 'webflow developer',
      'wordpress website designer', 'wordpress ecommerce', 'wordpress e commerce',
      'wordpress landing page', 'elementor developer',
      'wordpress speed optimisation', 'wordpress speed optimization',
      'wordpress bug fixes', 'wordpress website redesign',
      'woocommerce product upload', 'wordpress seo',
      'wordpress to next js migration',
    ],
    titleRoleWords: ['wordpress', 'woocommerce', 'website', 'ecommerce', 'landing page', 'online store'],
    detailRolePhrases: [
      'wordpress website development', 'wordpress website maintenance',
      'woocommerce store setup', 'ecommerce website development',
      'e commerce website development', 'online store development',
      'landing page development', 'website maintenance',
      'landing page redesign', 'conversion focused landing pages',
      'website redesign', 'marketing website development',
      'wordpress website design', 'wordpress ecommerce',
      'wordpress e commerce', 'wordpress landing page',
      'elementor development', 'wordpress speed optimisation',
      'wordpress speed optimization', 'wordpress bug fixes',
      'woocommerce product upload', 'wordpress seo',
      'wordpress to next js migration',
      'webflow development', 'website performance optimisation',
      'website performance optimization', 'website bug fixes',
    ],
    skillPhrases: [
      'wordpress', 'woocommerce', 'website maintenance', 'landing page',
      'ecommerce website', 'e commerce website', 'online store',
      'website redesign', 'marketing website', 'webflow',
      'elementor', 'wordpress speed', 'wordpress bug fixes',
      'woocommerce product upload', 'wordpress seo', 'wordpress to next js',
      'conversion focused landing pages',
      'ecommerce', 'e commerce', 'website performance',
      'website',
    ],
  },
  {
    id: 'design',
    titleRolePhrases: [
      'ui ux designer', 'ux ui designer', 'ui designer', 'ux designer',
      'web designer', 'landing page designer', 'marketing designer',
      'social media graphic designer', 'static ad creative designer',
      'static ad designer', 'social media designer', 'figma email designer',
      'email marketing designer', 'graphic designer',
      'digital ad designer', 'brand identity designer',
      'logo designer', 'presentation designer', 'figma email campaign designer',
      'ecommerce creative designer', 'e commerce creative designer',
      'ai ad creative designer', 'ai ugc video creator',
      'ai video ads creator', 'short form video editor', 'content designer',
      'landing page designer',
    ],
    titleRoleWords: ['designer', 'design', 'figma', 'graphic'],
    detailRolePhrases: [
      'landing page design', 'landing page redesign', 'marketing design',
      'static ad creative', 'social media graphics', 'email design',
      'saas interface design', 'design systems implementation',
      'user interface design', 'user experience design',
      'brand identity design', 'logo design', 'presentation design',
      'digital ad design', 'ecommerce creative', 'e commerce creative',
      'ai ad creative', 'ai ugc video', 'ai video ads',
      'short form video editing', 'content design',
    ],
    skillPhrases: [
      'figma', 'ui ux', 'user interface', 'user experience',
      'landing page design', 'marketing design', 'static ad creative',
      'social media graphics', 'email design', 'design systems',
      'marketing designer',
      'brand identity', 'logo design', 'presentation design',
      'digital ad', 'ecommerce creative', 'e commerce creative',
      'ai ad creative', 'ai ugc video', 'ai video ads',
      'short form video', 'content design', 'graphic designer',
      'logo designer', 'presentation designer', 'social media graphic designer',
    ],
  },
  {
    id: 'content',
    titleRolePhrases: [
      'email copywriter', 'landing page copywriter', 'website copywriter',
      'technical content writer', 'technical writer', 'content strategist',
      'content writer', 'email marketing copywriter',
      'social media content creator', 'social media manager',
      'content marketing assistant', 'saas content writer',
      'content repurposing specialist', 'ai content creator',
      'digital marketing assistant',
    ],
    detailRolePhrases: [
      'email copywriting', 'landing page copywriting', 'website copywriting',
      'technical content writing', 'content strategy',
      'social media content creation', 'social media management',
      'content marketing assistance', 'saas content writing',
      'content repurposing', 'ai content creation',
      'digital marketing assistance',
    ],
    skillPhrases: [
      'email copywriting', 'landing page copywriting', 'website copywriting',
      'email copy', 'landing page copy', 'website copy',
      'technical content', 'content strategy', 'copywriting',
      'content writing', 'content writer', 'social media content',
      'social media management', 'social media manager',
      'content marketing', 'saas content', 'content repurposing',
      'ai content', 'digital marketing',
    ],
    titleRoleWords: ['copywriter', 'writer', 'content', 'strategist'],
  },
]

const socialGraphicsEvidence = [
  'marketing design', 'static ad creative', 'social media graphics',
  'advertising creative', 'brand assets',
]

const productDesignEvidence = [
  'figma', 'ui ux', 'user experience', 'user interface',
  'saas interface design', 'design systems',
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function containsPhrase(text: string, phrase: string) {
  return ` ${text} `.includes(` ${normalize(phrase)} `)
}

function hasAnyPhrase(text: string, phrases: string[]) {
  return phrases.some((phrase) => containsPhrase(text, phrase))
}

export function getTargetJobCategories(
  title: string,
  details = '',
  metadata: string[] = [],
): TargetJobCategory[] {
  const normalizedTitle = normalize(title)
  const normalizedDetails = normalize([details, ...metadata].join(' '))
  const normalizedDescription = normalize(details)
  const combinedText = `${normalizedTitle} ${normalizedDetails}`
  const titleHasSpecificWebRole = hasAnyPhrase(normalizedTitle, [
    'full stack', 'fullstack', 'front end', 'frontend', 'react', 'next js',
  ])

  if (
    containsPhrase(normalizedTitle, 'shopify')
    || /\.net\b/i.test(title)
    || (containsPhrase(normalizedTitle, 'software engineer') && !titleHasSpecificWebRole)
  ) {
    return []
  }

  const matches = searchLanes
    .filter((lane) => {
      const titleHasRoleWord = hasAnyPhrase(normalizedTitle, lane.titleRoleWords)
      const roleMatches = hasAnyPhrase(normalizedTitle, lane.titleRolePhrases)
        || (titleHasRoleWord && hasAnyPhrase(normalizedDescription, lane.detailRolePhrases))
      const skillMatches = hasAnyPhrase(combinedText, lane.skillPhrases)
      return roleMatches && skillMatches
    })
    .map((lane) => lane.id)

  if (
    containsPhrase(normalizedTitle, 'product designer')
    && hasAnyPhrase(normalizedDetails, productDesignEvidence)
  ) {
    matches.push('design')
  }

  if (
    containsPhrase(normalizedTitle, 'graphic designer')
    && hasAnyPhrase(normalizedDetails, socialGraphicsEvidence)
  ) {
    matches.push('design')
  }

  return Array.from(new Set(matches))
}

export function isTargetJob(title: string, details = '', metadata: string[] = []) {
  return getTargetJobCategories(title, details, metadata).length > 0
}
