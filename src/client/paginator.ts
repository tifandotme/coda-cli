export interface PageResponse<T> {
  items: T[];
  nextPageToken?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FetchPage<T> = (pageToken?: string) => Promise<any>;

export async function* paginate<T>(fetchPage: FetchPage<T>): AsyncGenerator<T[], void, void> {
  let pageToken: string | undefined;
  do {
    const result = await fetchPage(pageToken);
    yield result.items;
    pageToken = result.nextPageToken;
  } while (pageToken);
}

export async function fetchAll<T>(fetchPage: FetchPage<T>): Promise<T[]> {
  const all: T[] = [];
  for await (const page of paginate(fetchPage)) {
    all.push(...page);
  }
  return all;
}
