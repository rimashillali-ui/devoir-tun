// Map des quiz disponibles : clé = `${levelSlug}/${subject}`
// levelSlug utilise : 9eme, 1sec, 2sc, 3eme-maths, bac-maths, bac-sciences
// subject : math | svt
// Colle le HTML complet (avec <html>, <style>, <script>) pour chaque combinaison.
// Un quiz vide (chaîne vide) affichera un placeholder "bientôt disponible".

export type QuizKey = `${string}/${"math" | "svt"}`;

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>Quiz</title></head>
<body style="font-family:Arial;padding:24px;text-align:center;background:#d6eaf8;">
  <h2>Ceci est un exemple de quiz.</h2>
  <p>Remplacez le HTML dans <code>src/lib/quizzes.ts</code> pour cette combinaison.</p>
</body>
</html>`;

export const QUIZZES: Record<string, string> = {
  "9eme/math": "",
  "9eme/svt": "",
  "1sec/math": "",
  "1sec/svt": "",
  "2sc/math": "",
  "2sc/svt": "",
  "3eme-maths/math": "",
  "3eme-maths/svt": "",
  "bac-maths/math": "",
  "bac-maths/svt": "",
  "bac-sciences/math": SAMPLE_HTML, // exemple — remplace par ton HTML
  "bac-sciences/svt": "",
};

export const QUIZ_MENU: Array<{ level: string; label_fr: string; label_ar: string }> = [
  { level: "9eme", label_fr: "9ème année", label_ar: "التاسعة" },
  { level: "1sec", label_fr: "1ère année sec.", label_ar: "الأولى ثانوي" },
  { level: "2sc", label_fr: "2ème sciences", label_ar: "الثانية علوم" },
  { level: "3eme-maths", label_fr: "3ème math", label_ar: "الثالثة رياضيات" },
  { level: "bac-maths", label_fr: "Bac Math", label_ar: "بكالوريا رياضيات" },
  { level: "bac-sciences", label_fr: "Bac Science", label_ar: "بكالوريا علوم" },
];

export const QUIZ_SUBJECTS: Array<{ id: "math" | "svt"; label_fr: string; label_ar: string }> = [
  { id: "math", label_fr: "Math", label_ar: "رياضيات" },
  { id: "svt", label_fr: "SVT", label_ar: "علوم الحياة" },
];
