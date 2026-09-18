import { prisma } from "@/lib/database/prisma";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getJsonSetting<T>(key: string, fallback: T): Promise<T> {
  const raw = await getSetting(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJsonSetting(key: string, value: unknown) {
  return setSetting(key, JSON.stringify(value));
}

const CATEGORIES_KEY = "business_categories";

export async function getCategories(): Promise<string[]> {
  return getJsonSetting<string[]>(CATEGORIES_KEY, []);
}

export async function addCategory(category: string) {
  const categories = await getCategories();
  const trimmed = category.trim();
  if (!trimmed || categories.includes(trimmed)) return categories;
  const next = [...categories, trimmed];
  await setJsonSetting(CATEGORIES_KEY, next);
  return next;
}

export async function removeCategory(category: string) {
  const categories = await getCategories();
  const next = categories.filter((c) => c !== category);
  await setJsonSetting(CATEGORIES_KEY, next);
  return next;
}