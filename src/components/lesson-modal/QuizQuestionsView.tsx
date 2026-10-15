'use client';
import React from 'react';
import { QuizQuestion } from './lessonModalTypes';
import { CheckCircle2, X } from 'lucide-react';

interface QuizQuestionsViewProps {
  activeQuestions: QuizQuestion[];
  quizQuestionIdx: number;
  quizAnswers: (number | null)[];
  isExamNode: boolean;
  isUnit4Exam?: boolean;
  onSelectAnswer: (questionIdx: number, optIdx: number) => void;
  onNextQuestion: () => void;
}

export const QuizQuestionsView: React.FC<QuizQuestionsViewProps> = ({
  activeQuestions,
  quizQuestionIdx,
  quizAnswers,
  isExamNode,
  isUnit4Exam = false,
  onSelectAnswer,
  onNextQuestion
}) => {
  const currentQuestion = activeQuestions[quizQuestionIdx];
  const currentAnswer = quizAnswers[quizQuestionIdx];
  const hasAnsweredCurrent = currentAnswer !== null;

  if (!currentQuestion) return null;

  return (
    <div className="space-y-4 text-left animate-fadeIn">
      {/* Top Header Pill */}
      <div className="flex items-center justify-between bg-indigo-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-indigo-100 dark:border-slate-700">
        <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">
          {isExamNode
            ? `EVALUACIÓN DE MÓDULO (${quizQuestionIdx + 1}/${activeQuestions.length})`
            : `QUIZ DE COMPROBACIÓN (${quizQuestionIdx + 1}/4)`}
        </span>
        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
          {isUnit4Exam ? 'Módulo 4' : isExamNode ? 'Módulo 1' : 'Clase 1'}
        </span>
      </div>

      {/* Question Prompt */}
      <p className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-snug">
        {currentQuestion.question}
      </p>

      {/* Options List */}
      <div className="space-y-2.5">
        {currentQuestion.options.map((optText, optIdx) => {
          const isSelected = currentAnswer === optIdx;
          const isCorrect = optIdx === currentQuestion.correctAnswer;

          let btnStyle =
            'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80';

          if (isSelected) {
            if (isCorrect) {
              btnStyle =
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-extrabold shadow-sm';
            } else {
              btnStyle =
                'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-extrabold shadow-sm';
            }
          } else if (hasAnsweredCurrent && isCorrect) {
            btnStyle =
              'border-emerald-400/70 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold';
          }

          return (
            <button
              key={optIdx}
              disabled={hasAnsweredCurrent}
              onClick={() => onSelectAnswer(quizQuestionIdx, optIdx)}
              className={`w-full p-3.5 rounded-2xl border text-xs md:text-sm font-bold text-left transition-all flex items-center justify-between ${
                hasAnsweredCurrent ? 'cursor-default' : 'cursor-pointer press-effect'
              } ${btnStyle}`}
            >
              <span>{optText}</span>
              {isSelected && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
              )}
              {isSelected && !isCorrect && (
                <X className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Card */}
      {hasAnsweredCurrent && (
        <div
          className={`p-4 rounded-2xl border transition-all animate-fadeIn space-y-1 ${
            currentAnswer === currentQuestion.correctAnswer
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
              : 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
          }`}
        >
          <span
            className={`text-[11px] font-black uppercase tracking-wider block ${
              currentAnswer === currentQuestion.correctAnswer
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {currentAnswer === currentQuestion.correctAnswer
              ? 'RESPUESTA CORRECTA'
              : 'RESPUESTA INCORRECTA'}
          </span>
          <p className="text-xs font-semibold leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Advance Button */}
      <button
        onClick={onNextQuestion}
        disabled={!hasAnsweredCurrent}
        className={`w-full py-3.5 rounded-full font-heading font-bold text-sm mt-3 transition-all ${
          hasAnsweredCurrent
            ? 'tactile-btn-primary cursor-pointer'
            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
        }`}
      >
        {quizQuestionIdx < activeQuestions.length - 1
          ? `Siguiente Pregunta (${quizQuestionIdx + 1}/${activeQuestions.length})`
          : `Finalizar Evaluación (${activeQuestions.length}/${activeQuestions.length})`}
      </button>
    </div>
  );
};
