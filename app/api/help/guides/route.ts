import { NextResponse } from 'next/server';
import enMessages from '@/messages/en.json';
import idMessages from '@/messages/id.json';

export const dynamic = 'force-dynamic';

type Locale = 'id' | 'en';

type GuideEndpoint = {
  method: string;
  path: string;
  description: string;
};

type GuideSection = {
  title: string;
  description: string;
  endpoints?: GuideEndpoint[];
};

type GuideStep = {
  title: string;
  description: string;
  content: string;
};

type GuideVideo = {
  title: string;
  url: string;
  duration: string;
  thumbnail: string;
};

type GuideContact = {
  type: string;
  value: string;
  icon: string;
  responseTime: string;
};

type Guide = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  duration: string;
  difficulty: string;
  steps?: GuideStep[];
  videos?: GuideVideo[];
  sections?: GuideSection[];
  contacts?: GuideContact[];
  supportHours?: Record<string, string>;
  relatedGuides: string[];
  tags: string[];
  views: number;
  lastUpdated: string;
};

type HelpApiMessages = {
  guideNotFound?: string;
  failedFetchGuides?: string;
};

type Dictionary = {
  help?: {
    api?: HelpApiMessages;
    guideItems?: Guide[];
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  id: idMessages as unknown as Dictionary,
  en: enMessages as unknown as Dictionary,
};

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function resolveLocale(value?: string | null): Locale {
  const locale = normalize(value).split('-')[0];
  return locale === 'en' ? 'en' : 'id';
}

function getLocaleFromRequest(request: Request): Locale {
  const { searchParams } = new URL(request.url);
  const langParam = searchParams.get('lang');

  if (langParam) {
    return resolveLocale(langParam);
  }

  return resolveLocale(request.headers.get('accept-language'));
}

function getHelpApiMessages(locale: Locale): Required<HelpApiMessages> {
  const fallback = dictionaries.id.help?.api ?? {};
  const selected = dictionaries[locale].help?.api ?? {};

  return {
    guideNotFound: selected.guideNotFound ?? fallback.guideNotFound ?? 'Panduan tidak ditemukan',
    failedFetchGuides:
      selected.failedFetchGuides ?? fallback.failedFetchGuides ?? 'Gagal mengambil panduan',
  };
}

function getGuides(locale: Locale): Guide[] {
  const selected = dictionaries[locale].help?.guideItems;
  const fallback = dictionaries.id.help?.guideItems ?? [];

  return Array.isArray(selected) ? selected : fallback;
}

function guideSearchFields(guide: Guide) {
  return [
    guide.id,
    guide.title,
    guide.description,
    guide.category,
    guide.duration,
    guide.difficulty,
    ...(guide.tags ?? []),
    ...(guide.steps ?? []).flatMap((step) => [step.title, step.description, step.content]),
    ...(guide.videos ?? []).flatMap((video) => [video.title, video.duration]),
    ...(guide.sections ?? []).flatMap((section) => [
      section.title,
      section.description,
      ...(section.endpoints ?? []).flatMap((endpoint) => [
        endpoint.method,
        endpoint.path,
        endpoint.description,
      ]),
    ]),
    ...(guide.contacts ?? []).flatMap((contact) => [
      contact.type,
      contact.value,
      contact.responseTime,
    ]),
  ];
}

function matchesSearch(guide: Guide, search: string) {
  const selectedSearch = normalize(search);
  return guideSearchFields(guide).some((field) => normalize(field).includes(selectedSearch));
}

// GET: Fetch all guides, fetch specific guide, filter by category, or search by text
export async function GET(request: Request) {
  const locale = getLocaleFromRequest(request);
  const messages = getHelpApiMessages(locale);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let filteredGuides = getGuides(locale);

    if (id) {
      const guide = filteredGuides.find((item) => item.id === id);

      if (!guide) {
        return NextResponse.json(
          {
            success: false,
            lang: locale,
            error: messages.guideNotFound,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        lang: locale,
        data: guide,
      });
    }

    if (category) {
      const selectedCategory = normalize(category);
      filteredGuides = filteredGuides.filter(
        (guide) => normalize(guide.category) === selectedCategory
      );
    }

    if (search) {
      filteredGuides = filteredGuides.filter((guide) => matchesSearch(guide, search));
    }

    return NextResponse.json({
      success: true,
      lang: locale,
      count: filteredGuides.length,
      data: filteredGuides,
    });
  } catch (error) {
    console.error('Error fetching guides:', error);

    return NextResponse.json(
      {
        success: false,
        lang: locale,
        error: error instanceof Error ? error.message : messages.failedFetchGuides,
      },
      { status: 500 }
    );
  }
}
