import { NextResponse } from 'next/server';
import enMessages from '@/messages/en.json';
import idMessages from '@/messages/id.json';

export const dynamic = 'force-dynamic';

type Locale = 'id' | 'en';

type FaqQuestion = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  views: number;
  helpful: number;
};

type FaqCategory = {
  id: string;
  category: string;
  categoryKey?: string;
  questions: FaqQuestion[];
};

type HelpApiMessages = {
  faqIdRequired?: string;
  feedbackRecorded?: string;
  failedFetchFaqs?: string;
  failedRecordFeedback?: string;
};

type Dictionary = {
  help?: {
    api?: HelpApiMessages;
    faqItems?: FaqCategory[];
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
    faqIdRequired: selected.faqIdRequired ?? fallback.faqIdRequired ?? 'faqId wajib diisi',
    feedbackRecorded: selected.feedbackRecorded ?? fallback.feedbackRecorded ?? 'Feedback berhasil dicatat',
    failedFetchFaqs: selected.failedFetchFaqs ?? fallback.failedFetchFaqs ?? 'Gagal mengambil FAQ',
    failedRecordFeedback:
      selected.failedRecordFeedback ?? fallback.failedRecordFeedback ?? 'Gagal mencatat feedback',
  };
}

function getFaqs(locale: Locale): FaqCategory[] {
  const selected = dictionaries[locale].help?.faqItems;
  const fallback = dictionaries.id.help?.faqItems ?? [];

  return Array.isArray(selected) ? selected : fallback;
}

function matchesCategory(faq: FaqCategory, category: string) {
  const selectedCategory = normalize(category);

  return [faq.id, faq.category, faq.categoryKey]
    .filter(Boolean)
    .some((value) => normalize(value) === selectedCategory);
}

function matchesSearch(question: FaqQuestion, search: string) {
  const selectedSearch = normalize(search);

  return (
    normalize(question.question).includes(selectedSearch) ||
    normalize(question.answer).includes(selectedSearch) ||
    question.tags.some((tag) => normalize(tag).includes(selectedSearch))
  );
}

// GET: Fetch all FAQs, filter by category, or search by text
export async function GET(request: Request) {
  const locale = getLocaleFromRequest(request);
  const messages = getHelpApiMessages(locale);

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let filteredFaqs = getFaqs(locale);

    if (category) {
      filteredFaqs = filteredFaqs.filter((faq) => matchesCategory(faq, category));
    }

    if (search) {
      filteredFaqs = filteredFaqs
        .map((faq) => ({
          ...faq,
          questions: faq.questions.filter((question) => matchesSearch(question, search)),
        }))
        .filter((faq) => faq.questions.length > 0);
    }

    return NextResponse.json({
      success: true,
      lang: locale,
      count: filteredFaqs.reduce((total, faq) => total + faq.questions.length, 0),
      data: filteredFaqs,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);

    return NextResponse.json(
      {
        success: false,
        lang: locale,
        error: error instanceof Error ? error.message : messages.failedFetchFaqs,
      },
      { status: 500 }
    );
  }
}

// POST: Mark FAQ as helpful
export async function POST(request: Request) {
  const locale = getLocaleFromRequest(request);
  const messages = getHelpApiMessages(locale);

  try {
    const { faqId, helpful } = await request.json();

    if (!faqId) {
      return NextResponse.json(
        {
          success: false,
          lang: locale,
          error: messages.faqIdRequired,
        },
        { status: 400 }
      );
    }

    // In production, save this to database.
    return NextResponse.json({
      success: true,
      lang: locale,
      message: messages.feedbackRecorded,
      data: {
        faqId,
        helpful: Boolean(helpful),
      },
    });
  } catch (error) {
    console.error('Error recording feedback:', error);

    return NextResponse.json(
      {
        success: false,
        lang: locale,
        error: error instanceof Error ? error.message : messages.failedRecordFeedback,
      },
      { status: 500 }
    );
  }
}
