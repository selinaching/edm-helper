export interface Brand {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface EDMFormat {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface TopicCategory {
  id: string;
  name: string;
  symbol?: string; // 自定义编辑标签符号，如 "✍️", "🎉", "🔥" 等
  color?: string;
  isDefault?: boolean;
}

export interface Topic {
  id: string;
  brand: string;
  category: string; // 类别：节日活动 / 普通 / 自定义类别
  topic: string; // 主题标题
  subtopic?: string; // 对应子标题
  emailType: string;
  marketingAngle?: string;
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 描述项：包含关键词（长描述、短描述等）与具体内容
export interface ProductDescriptionItem {
  id: string;
  keyword: string; // 关键词，例如 "长描述"、"短描述"、"海外官网风"
  content: string; // 描述内容
}

// 功能语言风格变体 / 卖点描述变体
export interface FeatureDescriptionVariant {
  id: string;
  style: string; // 风格，例如 "技术参数风"、"场景体验风"、"痛点转化风" 或 "描述1"
  text: string;  // 描述文本
}

// 卖点描述子项 (描述1, 描述2, 描述3...)
export interface SellingPointDescription {
  id: string;
  label?: string; // 如 "描述1", "描述2", "痛点转化风" 等
  text: string;   // 描述正文
}

// 卖点项 (支持一个卖点对应多条描述：卖点A -> 描述1、描述2、描述3...)
export interface ProductSellingPoint {
  id: string;
  title: string; // 卖点名称，例如 "卖点A: 底部高效聚能环系统"
  descriptions: SellingPointDescription[]; // 对应的多条描述
}

// 卖点与功能特性兼容项
export interface ProductFeatureItem {
  id: string;
  name: string; // 功能/卖点名称
  descriptions: FeatureDescriptionVariant[]; // 对应不同语言风格的描述
}

export interface Product {
  id: string;
  brand: string;
  productName: string;
  sku?: string; // SKU
  discount?: string; // 优惠，例如 "8折"、"立减$50"、"买二赠一"
  originalPrice?: string; // 原价（例如 $299.99，带删除线）
  price: string; // 活动价/现价（例如 $99.99）
  productUrl: string;
  parameters?: string; // 产品参数（原规格）
  specifications?: string; // 规格参数兼容
  targetUseCases?: string;
  descriptions: ProductDescriptionItem[]; // 描述列表（描述1、描述2... 前置关键词）
  sellingPoints?: ProductSellingPoint[]; // 卖点项（卖点A -> 描述1、描述2、描述3...）
  featuresList?: ProductFeatureItem[]; // 兼容旧版功能卖点
  productStatus: 'Active' | 'Upcoming' | 'Discontinued' | 'Seasonal' | string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;

  // Backward compatibility fields for legacy records
  productType?: string;
  productDescription?: string;
  features?: string;
  keySellingPoints?: string;
  productImages?: string[];
}

export interface TemplateCategoryGroup {
  id: string;
  name: string; // 大类："HERO", "PRODUCT", "CONTENT" 或自定义
  subcategories: string[]; // 子类列表
}

export interface Template {
  id: string;
  templateName: string;
  mainCategory?: string; // 大类："HERO", "PRODUCT", "CONTENT" 等
  subCategory?: string; // 子类
  category?: string; // 兼容旧版
  brand?: string;
  screenshotUrl: string;
  referenceUrl?: string;
  description: string;
  notes?: string;
  tags: string[];
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EDMStatus = 'Planned' | 'In Progress' | 'Brief Ready' | 'Completed' | 'Cancelled';

export interface CalendarItem {
  id: string;
  brand: string;
  date: string; // YYYY-MM-DD
  topic: string;
  topicId?: string;
  topicCategory?: string;
  subtopic?: string;
  emailType?: string;
  marketingAngle?: string;
  productIds: string[];
  productNames?: string[];
  format?: string; // format 不是必填项
  campaignGoal?: string;
  notes?: string;
  status: EDMStatus;
  hasBrief?: boolean;
  briefId?: string;
  createdAt: string;
  updatedAt: string;
}

// CTA 按钮模型
export interface PositionCta {
  id: string;
  text: string;
  link?: string;
  category?: string;
}

// CTA 文案库项目
export interface CtaCopy {
  id: string;
  text: string;
  category: string; // 分类：通用型、转化类、促销类等，用户可自定义
  link?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// 展现类型全局配置（首焦屏与正文屏各自支持自定义增删改）
export interface DisplayTypeConfig {
  heroTypes: string[]; // 首焦区类型，如 "内容"、"促销"、"新品发布"等
  bodyTypes: string[]; // 第2、3、4等正文屏类型，如 "功能属性"、"媒体背书"、"场景体验"等
}

export interface EmailPosition {
  id: string;
  name: string; // "Hero", "Section 1", "Section 2", "Section 3", "Footer", or custom
  order: number;
  displayType?: string; // 展现类型（Hero: 内容、促销等；第2/3/4屏: 功能属性、媒体背书等；Footer不需要）
  templateId?: string;
  templateName?: string;
  templateScreenshot?: string;
  templateReferenceUrl?: string;
  content: string; // Rich editable text
  productIds: string[];
  productNames?: string[];
  link: string;
  keyRequirements: string;
  ctas?: PositionCta[]; // 每一屏的位置可增加/删除 CTA 按钮
}

export interface EmailBrief {
  id: string;
  calendarItemId: string;
  brand: string;
  date: string; // YYYY-MM-DD
  topic: string;
  subtopic?: string;
  subjectLine?: string; // 邮件主题行 (Subject Line)
  preheader?: string;   // 预览文本/摘要行 (Pre-header)
  format?: string;
  productIds: string[];
  positions: EmailPosition[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseBackup {
  version: string;
  exportedAt: string;
  brands: Brand[];
  formats: EDMFormat[];
  topics: Topic[];
  topicCategories?: TopicCategory[];
  products: Product[];
  templates: Template[];
  templateCategoryGroups?: TemplateCategoryGroup[];
  calendarItems: CalendarItem[];
  briefs: EmailBrief[];
  ctaCopies?: CtaCopy[];
}
