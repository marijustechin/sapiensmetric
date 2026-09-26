import type { ReactNode } from 'react';
import type { PageContent } from '../content/types';
import { AVAILABILITY_NOTE, UI_STRINGS } from '../content/site';
import type { AppLocale } from '../lib/locale-navigation';

/** Renders repository-managed public page/article content (T-013). */
export function ContentPage({
  page,
  locale,
  children,
}: {
  page: PageContent;
  locale: AppLocale;
  children?: ReactNode;
}) {
  const strings = UI_STRINGS[locale];
  return (
    <article className="flex flex-col gap-6">
      {page.availabilityNote ? (
        <p
          className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
          role="note"
        >
          {AVAILABILITY_NOTE[locale]}
        </p>
      ) : null}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{page.h1}</h1>
        <p className="text-lg text-slate-700">{page.intro}</p>
      </header>

      {page.blocks.map((block, index) => (
        <section key={block.heading ?? index} className="flex flex-col gap-3">
          {block.heading ? (
            <h2 className="text-xl font-semibold text-slate-900">{block.heading}</h2>
          ) : null}
          {block.paragraphs?.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="leading-7 text-slate-700">
              {paragraph}
            </p>
          ))}
          {block.bullets ? (
            <ul className="list-disc space-y-1 pl-5 text-slate-700">
              {block.bullets.map((bullet) => (
                <li key={bullet.slice(0, 24)} className="leading-7">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {children}

      {page.sources && page.sources.length > 0 ? (
        <section className="border-t border-slate-200 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {strings.sources}
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
            {page.sources.map((source) => (
              <li key={source.id}>
                <a
                  className="underline hover:text-slate-900"
                  href={source.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {source.label}
                </a>{' '}
                <span className="text-slate-500">({source.id})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-sm text-slate-500">
        {strings.updated}: <time dateTime={page.updated}>{page.updated}</time>
      </p>
    </article>
  );
}
