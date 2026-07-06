import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, GraduationCap } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { QUIZ_MENU, QUIZ_SUBJECTS } from "@/lib/quizzes";
import { useLang } from "@/lib/i18n";

export function UserSidebar() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="px-3 py-1.5 rounded-md hover:bg-white/5 flex items-center gap-1.5" aria-label="Menu">
        <Menu className="h-4 w-4" />
        <span className="hidden sm:inline">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-cyan" />
            {lang === "ar" ? "قائمتي" : "Mon menu"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
              {lang === "ar" ? "الاختبارات" : "Quiz"}
            </h3>
            <div className="space-y-3">
              {QUIZ_MENU.map((lvl) => (
                <div key={lvl.level} className="space-y-1">
                  <div className="text-sm font-semibold">
                    {lang === "ar" ? lvl.label_ar : lvl.label_fr}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-2">
                    {QUIZ_SUBJECTS.map((s) => (
                      <Link
                        key={s.id}
                        to="/quiz/$level/$subject"
                        params={{ level: lvl.level, subject: s.id }}
                        onClick={() => setOpen(false)}
                        className="text-sm px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-center"
                      >
                        {lang === "ar" ? s.label_ar : s.label_fr}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
