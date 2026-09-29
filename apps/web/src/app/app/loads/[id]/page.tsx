import { LoadDetail } from './load-detail';

export default async function LoadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LoadDetail id={id} />;
}
