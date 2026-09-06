import { redirect } from 'next/navigation';

export default async function ShortTripRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/trip/${slug}`);
}
