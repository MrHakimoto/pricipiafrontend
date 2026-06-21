// app/exercicios/q/[id]/page.tsx

import { QuestionStaticPanel } from "@/components/questions/QuestionStaticPanel";
import { useSession } from "next-auth/react";

type PageProps = {
  params: {
    id: string;
  };
};

export default function QuestaoUnitariaPage({ params }: PageProps) {


  const questionId = Number(params.id);

  return <QuestionStaticPanel questionId={questionId} />;
}
