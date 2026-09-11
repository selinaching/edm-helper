import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Brand,
  EDMFormat,
  Topic,
  TopicCategory,
  Product,
  Template,
  TemplateCategoryGroup,
  CalendarItem,
  EmailBrief,
  CtaCopy,
  DatabaseBackup,
  DisplayTypeConfig,
} from '../types';
import {
  INITIAL_BRANDS,
  INITIAL_FORMATS,
  INITIAL_TOPICS,
  INITIAL_TOPIC_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TEMPLATES,
  INITIAL_TEMPLATE_CATEGORY_GROUPS,
  INITIAL_CTA_COPIES,
  INITIAL_CALENDAR_ITEMS,
  INITIAL_BRIEFS,
} from './initialData';

const COLLECTIONS = {
  BRANDS: 'brands',
  FORMATS: 'formats',
  TOPICS: 'topics',
  TOPIC_CATEGORIES: 'topic_categories',
  PRODUCTS: 'products',
  TEMPLATES: 'templates',
  TEMPLATE_CATEGORIES: 'template_categories',
  CTA_COPIES: 'cta_copies',
  CALENDAR: 'calendar_items',
  BRIEFS: 'briefs',
  SETTINGS: 'settings',
  DISPLAY_TYPES: 'display_types',
};

// Local storage backup keys for zero-fail redundancy
const LS_KEYS = {
  BRANDS: 'edm_cached_brands',
  FORMATS: 'edm_cached_formats',
  TOPICS: 'edm_cached_topics',
  TOPIC_CATEGORIES: 'edm_cached_topic_categories',
  PRODUCTS: 'edm_cached_products',
  TEMPLATES: 'edm_cached_templates',
  TEMPLATE_CATEGORIES: 'edm_cached_template_categories',
  CTA_COPIES: 'edm_cached_cta_copies',
  CALENDAR: 'edm_cached_calendar',
  BRIEFS: 'edm_cached_briefs',
  DISPLAY_TYPES: 'edm_cached_display_types',
  SEEDED: 'edm_initial_seeded_v2',
};

export const DEFAULT_DISPLAY_TYPES: DisplayTypeConfig = {
  heroTypes: ['内容', '促销', '新品首发', '节日活动', '品牌故事', '测评推荐'],
  bodyTypes: ['功能属性', '媒体背书', '场景体验', '使用教程', '用户好评', '对比测评', '产品推荐'],
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore quota issues
  }
}

/**
 * Strips undefined properties and generates IDs if missing, preventing Firestore
 * "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 * Also removes transient parse helper flags like isValid, errors, isDuplicate.
 */
export function cleanForFirestore<T extends Record<string, any>>(data: T): T {
  const IGNORED_KEYS = new Set(['isValid', 'errors', 'isDuplicate', 'product']);
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (IGNORED_KEYS.has(key)) continue;
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key] = value.map((item) =>
          item && typeof item === 'object' ? cleanForFirestore(item) : item
        );
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        cleaned[key] = cleanForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  if (!cleaned.id) {
    cleaned.id = 'id_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  }
  return cleaned as T;
}

// ----------------------------------------------------
// INITIAL SEEDING
// ----------------------------------------------------
export async function ensureDatabaseSeeded(): Promise<void> {
  try {
    const brandsSnap = await getDocs(collection(db, COLLECTIONS.BRANDS));
    if (brandsSnap.empty) {
      console.log('Seeding initial Firestore EDM Planning data...');
      const batch = writeBatch(db);

      INITIAL_BRANDS.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.BRANDS, item.id), cleanForFirestore(item));
      });
      INITIAL_FORMATS.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.FORMATS, item.id), cleanForFirestore(item));
      });
      INITIAL_TOPICS.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.TOPICS, item.id), cleanForFirestore(item));
      });
      INITIAL_TOPIC_CATEGORIES.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.TOPIC_CATEGORIES, item.id), cleanForFirestore(item));
      });
      INITIAL_PRODUCTS.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.PRODUCTS, item.id), cleanForFirestore(item));
      });
      INITIAL_TEMPLATES.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.TEMPLATES, item.id), cleanForFirestore(item));
      });
      INITIAL_TEMPLATE_CATEGORY_GROUPS.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.TEMPLATE_CATEGORIES, item.id), cleanForFirestore(item));
      });
      INITIAL_CTA_COPIES.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.CTA_COPIES, item.id), cleanForFirestore(item));
      });
      INITIAL_CALENDAR_ITEMS.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.CALENDAR, item.id), cleanForFirestore(item));
      });
      INITIAL_BRIEFS.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.BRIEFS, item.id), cleanForFirestore(item));
      });

      await batch.commit();
      localStorage.setItem(LS_KEYS.SEEDED, 'true');
    }
  } catch (err) {
    console.warn('Firestore initial check/seed error (using local cache):', err);
    if (!localStorage.getItem(LS_KEYS.SEEDED)) {
      writeLocal(LS_KEYS.BRANDS, INITIAL_BRANDS);
      writeLocal(LS_KEYS.FORMATS, INITIAL_FORMATS);
      writeLocal(LS_KEYS.TOPICS, INITIAL_TOPICS);
      writeLocal(LS_KEYS.TOPIC_CATEGORIES, INITIAL_TOPIC_CATEGORIES);
      writeLocal(LS_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      writeLocal(LS_KEYS.TEMPLATES, INITIAL_TEMPLATES);
      writeLocal(LS_KEYS.TEMPLATE_CATEGORIES, INITIAL_TEMPLATE_CATEGORY_GROUPS);
      writeLocal(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES);
      writeLocal(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS);
      writeLocal(LS_KEYS.BRIEFS, INITIAL_BRIEFS);
      localStorage.setItem(LS_KEYS.SEEDED, 'true');
    }
  }
}

// ----------------------------------------------------
// BRANDS
// ----------------------------------------------------
export function subscribeBrands(callback: (brands: Brand[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.BRANDS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Brand);
        if (list.length > 0) {
          writeLocal(LS_KEYS.BRANDS, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.BRANDS, INITIAL_BRANDS));
        }
      },
      (error) => {
        console.warn('Firestore brands subscription fallback:', error);
        callback(readLocal(LS_KEYS.BRANDS, INITIAL_BRANDS));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.BRANDS, INITIAL_BRANDS));
    return () => {};
  }
}

export async function saveBrand(brand: Brand): Promise<void> {
  const clean = cleanForFirestore(brand);
  try {
    await setDoc(doc(db, COLLECTIONS.BRANDS, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save brand:', err);
  }
  const current = readLocal<Brand[]>(LS_KEYS.BRANDS, INITIAL_BRANDS);
  const updated = current.filter((b) => b.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.BRANDS, updated);
}

export async function deleteBrand(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.BRANDS, id));
  } catch (err) {
    console.warn('Offline delete brand:', err);
  }
  const current = readLocal<Brand[]>(LS_KEYS.BRANDS, INITIAL_BRANDS);
  writeLocal(LS_KEYS.BRANDS, current.filter((b) => b.id !== id));
}

// ----------------------------------------------------
// FORMATS
// ----------------------------------------------------
export function subscribeFormats(callback: (formats: EDMFormat[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.FORMATS),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as EDMFormat)
          .sort((a, b) => a.order - b.order);
        if (list.length > 0) {
          writeLocal(LS_KEYS.FORMATS, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.FORMATS, INITIAL_FORMATS));
        }
      },
      (error) => {
        console.warn('Firestore formats subscription fallback:', error);
        callback(readLocal(LS_KEYS.FORMATS, INITIAL_FORMATS));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.FORMATS, INITIAL_FORMATS));
    return () => {};
  }
}

export async function saveFormat(format: EDMFormat): Promise<void> {
  const clean = cleanForFirestore(format);
  try {
    await setDoc(doc(db, COLLECTIONS.FORMATS, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save format:', err);
  }
  const current = readLocal<EDMFormat[]>(LS_KEYS.FORMATS, INITIAL_FORMATS);
  const updated = current.filter((f) => f.id !== clean.id).concat(clean).sort((a, b) => a.order - b.order);
  writeLocal(LS_KEYS.FORMATS, updated);
}

export async function saveAllFormats(formats: EDMFormat[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    formats.forEach((f, idx) => {
      const item = cleanForFirestore({ ...f, order: idx + 1 });
      batch.set(doc(db, COLLECTIONS.FORMATS, item.id), item);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Offline saveAllFormats:', err);
  }
  writeLocal(LS_KEYS.FORMATS, formats);
}

export async function deleteFormat(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.FORMATS, id));
  } catch (err) {
    console.warn('Offline delete format:', err);
  }
  const current = readLocal<EDMFormat[]>(LS_KEYS.FORMATS, INITIAL_FORMATS);
  writeLocal(LS_KEYS.FORMATS, current.filter((f) => f.id !== id));
}

// ----------------------------------------------------
// TOPIC CATEGORIES (With Custom Symbols)
// ----------------------------------------------------
export function subscribeTopicCategories(callback: (categories: TopicCategory[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.TOPIC_CATEGORIES),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as TopicCategory);
        if (list.length > 0) {
          writeLocal(LS_KEYS.TOPIC_CATEGORIES, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.TOPIC_CATEGORIES, INITIAL_TOPIC_CATEGORIES));
        }
      },
      (error) => {
        console.warn('Firestore topic categories subscription fallback:', error);
        callback(readLocal(LS_KEYS.TOPIC_CATEGORIES, INITIAL_TOPIC_CATEGORIES));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.TOPIC_CATEGORIES, INITIAL_TOPIC_CATEGORIES));
    return () => {};
  }
}

export async function saveTopicCategory(category: TopicCategory): Promise<void> {
  const clean = cleanForFirestore(category);
  try {
    await setDoc(doc(db, COLLECTIONS.TOPIC_CATEGORIES, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save topic category:', err);
  }
  const current = readLocal<TopicCategory[]>(LS_KEYS.TOPIC_CATEGORIES, INITIAL_TOPIC_CATEGORIES);
  const updated = current.filter((c) => c.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.TOPIC_CATEGORIES, updated);
}

export async function saveAllTopicCategories(categories: TopicCategory[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    categories.forEach((cat) => {
      const item = cleanForFirestore(cat);
      batch.set(doc(db, COLLECTIONS.TOPIC_CATEGORIES, item.id), item, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Offline saveAllTopicCategories:', err);
  }
  writeLocal(LS_KEYS.TOPIC_CATEGORIES, categories);
}

export async function deleteTopicCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TOPIC_CATEGORIES, id));
  } catch (err) {
    console.warn('Offline delete topic category:', err);
  }
  const current = readLocal<TopicCategory[]>(LS_KEYS.TOPIC_CATEGORIES, INITIAL_TOPIC_CATEGORIES);
  writeLocal(LS_KEYS.TOPIC_CATEGORIES, current.filter((c) => c.id !== id));
}

// ----------------------------------------------------
// TOPIC LIBRARY
// ----------------------------------------------------
export function subscribeTopics(callback: (topics: Topic[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.TOPICS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Topic);
        if (list.length > 0) {
          writeLocal(LS_KEYS.TOPICS, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.TOPICS, INITIAL_TOPICS));
        }
      },
      (error) => {
        console.warn('Firestore topics subscription fallback:', error);
        callback(readLocal(LS_KEYS.TOPICS, INITIAL_TOPICS));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.TOPICS, INITIAL_TOPICS));
    return () => {};
  }
}

export async function saveTopic(topic: Topic): Promise<void> {
  const clean = cleanForFirestore(topic);
  try {
    await setDoc(doc(db, COLLECTIONS.TOPICS, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save topic:', err);
  }
  const current = readLocal<Topic[]>(LS_KEYS.TOPICS, INITIAL_TOPICS);
  const updated = current.filter((t) => t.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.TOPICS, updated);
}

export async function deleteTopic(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TOPICS, id));
  } catch (err) {
    console.warn('Offline delete topic:', err);
  }
  const current = readLocal<Topic[]>(LS_KEYS.TOPICS, INITIAL_TOPICS);
  writeLocal(LS_KEYS.TOPICS, current.filter((t) => t.id !== id));
}

export async function batchSaveTopics(topics: Topic[]): Promise<void> {
  const cleanedTopics = topics.map((t) => cleanForFirestore(t));
  try {
    const chunkSize = 400;
    for (let i = 0; i < cleanedTopics.length; i += chunkSize) {
      const chunk = cleanedTopics.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((t) => {
        batch.set(doc(db, COLLECTIONS.TOPICS, t.id), t, { merge: true });
      });
      await batch.commit();
    }
    console.log(`[Firestore] Successfully batch saved ${cleanedTopics.length} topics`);
  } catch (err) {
    console.warn('Offline batchSaveTopics:', err);
  }
  const current = readLocal<Topic[]>(LS_KEYS.TOPICS, INITIAL_TOPICS);
  const map = new Map(current.map((t) => [t.id, t]));
  cleanedTopics.forEach((t) => map.set(t.id, t));
  writeLocal(LS_KEYS.TOPICS, Array.from(map.values()));
}

// ----------------------------------------------------
// PRODUCT LIBRARY
// ----------------------------------------------------
export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.PRODUCTS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Product);
        if (list.length > 0) {
          writeLocal(LS_KEYS.PRODUCTS, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.PRODUCTS, INITIAL_PRODUCTS));
        }
      },
      (error) => {
        console.warn('Firestore products subscription fallback:', error);
        callback(readLocal(LS_KEYS.PRODUCTS, INITIAL_PRODUCTS));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.PRODUCTS, INITIAL_PRODUCTS));
    return () => {};
  }
}

export async function saveProduct(product: Product): Promise<void> {
  const clean = cleanForFirestore(product);
  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save product:', err);
  }
  const current = readLocal<Product[]>(LS_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const updated = current.filter((p) => p.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.PRODUCTS, updated);
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
  } catch (err) {
    console.warn('Offline delete product:', err);
  }
  const current = readLocal<Product[]>(LS_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  writeLocal(LS_KEYS.PRODUCTS, current.filter((p) => p.id !== id));
}

export async function batchSaveProducts(products: Product[]): Promise<void> {
  const cleanedProducts = products.map((p) => cleanForFirestore(p));
  const chunkSize = 400;
  for (let i = 0; i < cleanedProducts.length; i += chunkSize) {
    const chunk = cleanedProducts.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((p) => {
      batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), p, { merge: true });
    });
    await batch.commit();
  }
  console.log(`[Firestore] Successfully batch saved ${cleanedProducts.length} products`);
}

// ----------------------------------------------------
// TEMPLATE CATEGORIES (HERO, PRODUCT, CONTENT & Subcategories)
// ----------------------------------------------------
export function subscribeTemplateCategoryGroups(
  callback: (groups: TemplateCategoryGroup[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.TEMPLATE_CATEGORIES),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as TemplateCategoryGroup);
        if (list.length > 0) {
          writeLocal(LS_KEYS.TEMPLATE_CATEGORIES, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.TEMPLATE_CATEGORIES, INITIAL_TEMPLATE_CATEGORY_GROUPS));
        }
      },
      (error) => {
        console.warn('Firestore template categories subscription fallback:', error);
        callback(readLocal(LS_KEYS.TEMPLATE_CATEGORIES, INITIAL_TEMPLATE_CATEGORY_GROUPS));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.TEMPLATE_CATEGORIES, INITIAL_TEMPLATE_CATEGORY_GROUPS));
    return () => {};
  }
}

export async function saveTemplateCategoryGroup(group: TemplateCategoryGroup): Promise<void> {
  const clean = cleanForFirestore(group);
  try {
    await setDoc(doc(db, COLLECTIONS.TEMPLATE_CATEGORIES, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save template category group:', err);
  }
  const current = readLocal<TemplateCategoryGroup[]>(
    LS_KEYS.TEMPLATE_CATEGORIES,
    INITIAL_TEMPLATE_CATEGORY_GROUPS
  );
  const updated = current.filter((g) => g.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.TEMPLATE_CATEGORIES, updated);
}

export async function saveAllTemplateCategoryGroups(
  groups: TemplateCategoryGroup[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    groups.forEach((g) => {
      const item = cleanForFirestore(g);
      batch.set(doc(db, COLLECTIONS.TEMPLATE_CATEGORIES, item.id), item, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Offline saveAllTemplateCategoryGroups:', err);
  }
  writeLocal(LS_KEYS.TEMPLATE_CATEGORIES, groups);
}

// ----------------------------------------------------
// TEMPLATE LIBRARY
// ----------------------------------------------------
export function subscribeTemplates(callback: (templates: Template[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.TEMPLATES),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Template);
        if (list.length > 0) {
          writeLocal(LS_KEYS.TEMPLATES, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.TEMPLATES, INITIAL_TEMPLATES));
        }
      },
      (error) => {
        console.warn('Firestore templates subscription fallback:', error);
        callback(readLocal(LS_KEYS.TEMPLATES, INITIAL_TEMPLATES));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.TEMPLATES, INITIAL_TEMPLATES));
    return () => {};
  }
}

export async function saveTemplate(template: Template): Promise<void> {
  const clean = cleanForFirestore(template);
  try {
    await setDoc(doc(db, COLLECTIONS.TEMPLATES, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save template:', err);
  }
  const current = readLocal<Template[]>(LS_KEYS.TEMPLATES, INITIAL_TEMPLATES);
  const updated = current.filter((t) => t.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.TEMPLATES, updated);
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TEMPLATES, id));
  } catch (err) {
    console.warn('Offline delete template:', err);
  }
  const current = readLocal<Template[]>(LS_KEYS.TEMPLATES, INITIAL_TEMPLATES);
  writeLocal(LS_KEYS.TEMPLATES, current.filter((t) => t.id !== id));
}

// ----------------------------------------------------
// CTA COPY LIBRARY
// ----------------------------------------------------
export function subscribeCtaCopies(callback: (copies: CtaCopy[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.CTA_COPIES),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as CtaCopy);
        if (list.length > 0) {
          writeLocal(LS_KEYS.CTA_COPIES, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES));
        }
      },
      (error) => {
        console.warn('Firestore CTA copies subscription fallback:', error);
        callback(readLocal(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES));
    return () => {};
  }
}

export async function saveCtaCopy(cta: CtaCopy): Promise<void> {
  const clean = cleanForFirestore(cta);
  try {
    await setDoc(doc(db, COLLECTIONS.CTA_COPIES, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save CTA copy:', err);
  }
  const current = readLocal<CtaCopy[]>(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES);
  const updated = current.filter((c) => c.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.CTA_COPIES, updated);
}

export async function deleteCtaCopy(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CTA_COPIES, id));
  } catch (err) {
    console.warn('Offline delete CTA copy:', err);
  }
  const current = readLocal<CtaCopy[]>(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES);
  writeLocal(LS_KEYS.CTA_COPIES, current.filter((c) => c.id !== id));
}

export async function batchSaveCtaCopies(copies: CtaCopy[]): Promise<void> {
  const cleaned = copies.map((c) => cleanForFirestore(c));
  try {
    const batch = writeBatch(db);
    cleaned.forEach((c) => {
      batch.set(doc(db, COLLECTIONS.CTA_COPIES, c.id), c, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Offline batchSaveCtaCopies:', err);
  }
  const current = readLocal<CtaCopy[]>(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES);
  const map = new Map(current.map((c) => [c.id, c]));
  cleaned.forEach((c) => map.set(c.id, c));
  writeLocal(LS_KEYS.CTA_COPIES, Array.from(map.values()));
}

// ----------------------------------------------------
// EDM CALENDAR
// ----------------------------------------------------
export function subscribeCalendar(callback: (items: CalendarItem[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.CALENDAR),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as CalendarItem);
        if (list.length > 0) {
          writeLocal(LS_KEYS.CALENDAR, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS));
        }
      },
      (error) => {
        console.warn('Firestore calendar subscription fallback:', error);
        callback(readLocal(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS));
    return () => {};
  }
}

export async function saveCalendarItem(item: CalendarItem): Promise<void> {
  const clean = cleanForFirestore(item);
  try {
    await setDoc(doc(db, COLLECTIONS.CALENDAR, clean.id), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save calendar item:', err);
  }
  const current = readLocal<CalendarItem[]>(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS);
  const updated = current.filter((c) => c.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.CALENDAR, updated);
}

export async function deleteCalendarItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CALENDAR, id));
  } catch (err) {
    console.warn('Offline delete calendar item:', err);
  }
  const current = readLocal<CalendarItem[]>(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS);
  writeLocal(LS_KEYS.CALENDAR, current.filter((c) => c.id !== id));
}

export async function batchSaveCalendar(items: CalendarItem[]): Promise<void> {
  const cleanedItems = items.map((i) => cleanForFirestore(i));
  try {
    const chunkSize = 400;
    for (let i = 0; i < cleanedItems.length; i += chunkSize) {
      const chunk = cleanedItems.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        batch.set(doc(db, COLLECTIONS.CALENDAR, item.id), item, { merge: true });
      });
      await batch.commit();
    }
    console.log(`[Firestore] Successfully batch saved ${cleanedItems.length} calendar items`);
  } catch (err) {
    console.warn('Firestore batchSaveCalendar fallback to local:', err);
  }
  const current = readLocal<CalendarItem[]>(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS);
  const map = new Map(current.map((c) => [c.id, c]));
  cleanedItems.forEach((c) => map.set(c.id, c));
  writeLocal(LS_KEYS.CALENDAR, Array.from(map.values()));
}

// ----------------------------------------------------
// DISPLAY TYPES CONFIG (HERO & BODY SCREENS)
// ----------------------------------------------------
export function subscribeDisplayTypes(
  callback: (config: DisplayTypeConfig) => void
): () => void {
  try {
    return onSnapshot(
      doc(db, COLLECTIONS.DISPLAY_TYPES, 'config'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as DisplayTypeConfig;
          writeLocal(LS_KEYS.DISPLAY_TYPES, data);
          callback(data);
        } else {
          callback(readLocal(LS_KEYS.DISPLAY_TYPES, DEFAULT_DISPLAY_TYPES));
        }
      },
      (error) => {
        console.warn('Firestore display types subscription fallback:', error);
        callback(readLocal(LS_KEYS.DISPLAY_TYPES, DEFAULT_DISPLAY_TYPES));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.DISPLAY_TYPES, DEFAULT_DISPLAY_TYPES));
    return () => {};
  }
}

export async function saveDisplayTypes(config: DisplayTypeConfig): Promise<void> {
  const clean = cleanForFirestore(config);
  try {
    await setDoc(doc(db, COLLECTIONS.DISPLAY_TYPES, 'config'), clean, { merge: true });
  } catch (err) {
    console.warn('Offline save display types:', err);
  }
  writeLocal(LS_KEYS.DISPLAY_TYPES, config);
}

// ----------------------------------------------------
// EMAIL BRIEFS
// ----------------------------------------------------
export function subscribeBriefs(callback: (briefs: EmailBrief[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.BRIEFS),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as EmailBrief);
        if (list.length > 0) {
          writeLocal(LS_KEYS.BRIEFS, list);
          callback(list);
        } else {
          callback(readLocal(LS_KEYS.BRIEFS, INITIAL_BRIEFS));
        }
      },
      (error) => {
        console.warn('Firestore briefs subscription fallback:', error);
        callback(readLocal(LS_KEYS.BRIEFS, INITIAL_BRIEFS));
      }
    );
  } catch {
    callback(readLocal(LS_KEYS.BRIEFS, INITIAL_BRIEFS));
    return () => {};
  }
}

export async function saveBrief(brief: EmailBrief): Promise<void> {
  const clean = cleanForFirestore(brief);
  try {
    await setDoc(doc(db, COLLECTIONS.BRIEFS, clean.id), clean, { merge: true });
    if (clean.calendarItemId) {
      await setDoc(
        doc(db, COLLECTIONS.CALENDAR, clean.calendarItemId),
        { hasBrief: true, briefId: clean.id, status: 'Brief Ready' },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Offline save brief:', err);
  }
  const current = readLocal<EmailBrief[]>(LS_KEYS.BRIEFS, INITIAL_BRIEFS);
  const updated = current.filter((b) => b.id !== clean.id).concat(clean);
  writeLocal(LS_KEYS.BRIEFS, updated);
}

export async function deleteBrief(id: string, calendarItemId?: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.BRIEFS, id));
    if (calendarItemId) {
      await setDoc(
        doc(db, COLLECTIONS.CALENDAR, calendarItemId),
        { hasBrief: false, briefId: '' },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Offline delete brief:', err);
  }
  const current = readLocal<EmailBrief[]>(LS_KEYS.BRIEFS, INITIAL_BRIEFS);
  writeLocal(LS_KEYS.BRIEFS, current.filter((b) => b.id !== id));
}

// ----------------------------------------------------
// FULL DATABASE BACKUP & RESTORE (JSON)
// ----------------------------------------------------
export async function getFullDatabaseBackup(): Promise<DatabaseBackup> {
  let brands: Brand[] = [];
  let formats: EDMFormat[] = [];
  let topics: Topic[] = [];
  let topicCategories: TopicCategory[] = [];
  let products: Product[] = [];
  let templates: Template[] = [];
  let templateCategoryGroups: TemplateCategoryGroup[] = [];
  let ctaCopies: CtaCopy[] = [];
  let calendarItems: CalendarItem[] = [];
  let briefs: EmailBrief[] = [];

  try {
    const [bSnap, fSnap, topSnap, topCatSnap, prodSnap, tplSnap, tplCatSnap, ctaSnap, calSnap, brfSnap] =
      await Promise.all([
        getDocs(collection(db, COLLECTIONS.BRANDS)),
        getDocs(collection(db, COLLECTIONS.FORMATS)),
        getDocs(collection(db, COLLECTIONS.TOPICS)),
        getDocs(collection(db, COLLECTIONS.TOPIC_CATEGORIES)),
        getDocs(collection(db, COLLECTIONS.PRODUCTS)),
        getDocs(collection(db, COLLECTIONS.TEMPLATES)),
        getDocs(collection(db, COLLECTIONS.TEMPLATE_CATEGORIES)),
        getDocs(collection(db, COLLECTIONS.CTA_COPIES)),
        getDocs(collection(db, COLLECTIONS.CALENDAR)),
        getDocs(collection(db, COLLECTIONS.BRIEFS)),
      ]);

    brands = bSnap.docs.map((d) => d.data() as Brand);
    formats = fSnap.docs.map((d) => d.data() as EDMFormat);
    topics = topSnap.docs.map((d) => d.data() as Topic);
    topicCategories = topCatSnap.docs.map((d) => d.data() as TopicCategory);
    products = prodSnap.docs.map((d) => d.data() as Product);
    templates = tplSnap.docs.map((d) => d.data() as Template);
    templateCategoryGroups = tplCatSnap.docs.map((d) => d.data() as TemplateCategoryGroup);
    ctaCopies = ctaSnap.docs.map((d) => d.data() as CtaCopy);
    calendarItems = calSnap.docs.map((d) => d.data() as CalendarItem);
    briefs = brfSnap.docs.map((d) => d.data() as EmailBrief);
  } catch (err) {
    console.warn('Backup fetch Firestore fallback to local:', err);
  }

  if (brands.length === 0) brands = readLocal(LS_KEYS.BRANDS, INITIAL_BRANDS);
  if (formats.length === 0) formats = readLocal(LS_KEYS.FORMATS, INITIAL_FORMATS);
  if (topics.length === 0) topics = readLocal(LS_KEYS.TOPICS, INITIAL_TOPICS);
  if (topicCategories.length === 0) topicCategories = readLocal(LS_KEYS.TOPIC_CATEGORIES, INITIAL_TOPIC_CATEGORIES);
  if (products.length === 0) products = readLocal(LS_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  if (templates.length === 0) templates = readLocal(LS_KEYS.TEMPLATES, INITIAL_TEMPLATES);
  if (templateCategoryGroups.length === 0) templateCategoryGroups = readLocal(LS_KEYS.TEMPLATE_CATEGORIES, INITIAL_TEMPLATE_CATEGORY_GROUPS);
  if (ctaCopies.length === 0) ctaCopies = readLocal(LS_KEYS.CTA_COPIES, INITIAL_CTA_COPIES);
  if (calendarItems.length === 0) calendarItems = readLocal(LS_KEYS.CALENDAR, INITIAL_CALENDAR_ITEMS);
  if (briefs.length === 0) briefs = readLocal(LS_KEYS.BRIEFS, INITIAL_BRIEFS);

  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    brands,
    formats,
    topics,
    topicCategories,
    products,
    templates,
    templateCategoryGroups,
    ctaCopies,
    calendarItems,
    briefs,
  };
}

export async function restoreFullDatabase(backup: DatabaseBackup): Promise<void> {
  if (!backup || !backup.brands || !backup.calendarItems) {
    throw new Error('Invalid backup file format.');
  }

  try {
    const batch = writeBatch(db);
    backup.brands?.forEach((b) => batch.set(doc(db, COLLECTIONS.BRANDS, b.id), cleanForFirestore(b)));
    backup.formats?.forEach((f) => batch.set(doc(db, COLLECTIONS.FORMATS, f.id), cleanForFirestore(f)));
    backup.topics?.forEach((t) => batch.set(doc(db, COLLECTIONS.TOPICS, t.id), cleanForFirestore(t)));
    backup.topicCategories?.forEach((tc) => batch.set(doc(db, COLLECTIONS.TOPIC_CATEGORIES, tc.id), cleanForFirestore(tc)));
    backup.products?.forEach((p) => batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), cleanForFirestore(p)));
    backup.templates?.forEach((t) => batch.set(doc(db, COLLECTIONS.TEMPLATES, t.id), cleanForFirestore(t)));
    backup.templateCategoryGroups?.forEach((tcg) => batch.set(doc(db, COLLECTIONS.TEMPLATE_CATEGORIES, tcg.id), cleanForFirestore(tcg)));
    backup.ctaCopies?.forEach((c) => batch.set(doc(db, COLLECTIONS.CTA_COPIES, c.id), cleanForFirestore(c)));
    backup.calendarItems?.forEach((c) => batch.set(doc(db, COLLECTIONS.CALENDAR, c.id), cleanForFirestore(c)));
    backup.briefs?.forEach((b) => batch.set(doc(db, COLLECTIONS.BRIEFS, b.id), cleanForFirestore(b)));
    await batch.commit();
  } catch (err) {
    console.warn('Firestore restore batch error, saving to local cache:', err);
  }

  if (backup.brands) writeLocal(LS_KEYS.BRANDS, backup.brands);
  if (backup.formats) writeLocal(LS_KEYS.FORMATS, backup.formats);
  if (backup.topics) writeLocal(LS_KEYS.TOPICS, backup.topics);
  if (backup.topicCategories) writeLocal(LS_KEYS.TOPIC_CATEGORIES, backup.topicCategories);
  if (backup.products) writeLocal(LS_KEYS.PRODUCTS, backup.products);
  if (backup.templates) writeLocal(LS_KEYS.TEMPLATES, backup.templates);
  if (backup.templateCategoryGroups) writeLocal(LS_KEYS.TEMPLATE_CATEGORIES, backup.templateCategoryGroups);
  if (backup.ctaCopies) writeLocal(LS_KEYS.CTA_COPIES, backup.ctaCopies);
  if (backup.calendarItems) writeLocal(LS_KEYS.CALENDAR, backup.calendarItems);
  if (backup.briefs) writeLocal(LS_KEYS.BRIEFS, backup.briefs);
}

export async function fetchAllData(): Promise<DatabaseBackup> {
  await ensureDatabaseSeeded();
  return getFullDatabaseBackup();
}

export async function exportFullDatabaseBackup(): Promise<string> {
  const data = await getFullDatabaseBackup();
  return JSON.stringify(data, null, 2);
}

export async function restoreFullDatabaseBackup(jsonString: string): Promise<void> {
  const parsed = JSON.parse(jsonString) as DatabaseBackup;
  await restoreFullDatabase(parsed);
}

export async function resetDatabaseToDefault(): Promise<void> {
  const defaultBackup: DatabaseBackup = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    brands: INITIAL_BRANDS,
    formats: INITIAL_FORMATS,
    topics: INITIAL_TOPICS,
    topicCategories: INITIAL_TOPIC_CATEGORIES,
    products: INITIAL_PRODUCTS,
    templates: INITIAL_TEMPLATES,
    templateCategoryGroups: INITIAL_TEMPLATE_CATEGORY_GROUPS,
    ctaCopies: INITIAL_CTA_COPIES,
    calendarItems: INITIAL_CALENDAR_ITEMS,
    briefs: INITIAL_BRIEFS,
  };
  await restoreFullDatabase(defaultBackup);
}
