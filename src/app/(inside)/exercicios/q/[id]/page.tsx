// app/exercicios/q/[id]/page.tsx

import { QuestionStaticPanel } from "@/components/questions/QuestionStaticPanel";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuestaoUnitariaPage({ params }: PageProps) {
  const { id } = await params;

  const questionId = Number(id);

  return <QuestionStaticPanel questionId={questionId} />;
}