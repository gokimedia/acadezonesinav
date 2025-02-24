'use server';

import LiveResultsClient from './LiveResultsClient';

export default async function LiveResults({
  params,
}: {
  params: { examId: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <LiveResultsClient examId={params.examId} />
    </div>
  );
}