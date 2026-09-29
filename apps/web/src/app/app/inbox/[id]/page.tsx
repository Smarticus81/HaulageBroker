import { DocDetail } from './doc-detail';

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocDetail id={id} />;
}
