"use client";
import { useState } from "react";
import { questions } from "@/utils/db";
import {ModelQuestions} from "@/components/questions/ModelQuestions"
import {FilterPanel} from "@/components/Panel/PanelFilter"
import {ExercisesHeader} from "@/components/questions/ExercisesHeader"
export default function ProvasFamosas() {


  return (
    <div className="min-h-screen bg-[#00091A]">
     <ExercisesHeader></ExercisesHeader>

      {/* Filters Panel */}
      <div className="max-w-6xl mx-auto mt-5 px-4">
    <FilterPanel></FilterPanel>
</div>

    </div>
  );
}
