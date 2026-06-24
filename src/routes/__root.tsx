import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/lib/i18n";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TopBanner } from "@/components/TopBanner";
import { CookieBanner } from "@/components/CookieBanner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass p-10 max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page introuvable — الصفحة غير موجودة</p>
        <Link to="/" className="mt-6 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Devoiratouna — دوفواراتنا" },
      { name: "description", content: "Plateforme éducative tunisienne gratuite — منصة تربوية تونسية مجانية" },
      { property: "og:site_name", content: "Devoiratouna" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Devoiratouna — دوفواراتنا" },
      { name: "twitter:title", content: "Devoiratouna — دوفواراتنا" },
      { property: "og:description", content: "Plateforme éducative tunisienne gratuite — منصة تربوية تونسية مجانية" },
      { name: "twitter:description", content: "Plateforme éducative tunisienne gratuite — منصة تربوية تونسية مجانية" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e695af64-36dc-4d72-aefb-5c0093bc3193/id-preview-b65adea1--a9b510ca-dbc4-4dac-bff0-cf0fceeff967.lovable.app-1782138409238.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e695af64-36dc-4d72-aefb-5c0093bc3193/id-preview-b65adea1--a9b510ca-dbc4-4dac-bff0-cf0fceeff967.lovable.app-1782138409238.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Tajawal:wght@400;700&family=Cairo:wght@400;700&display=swap",
        // @ts-expect-error fetchpriority is a valid HTML attribute
        fetchpriority: "high",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Tajawal:wght@400;700&family=Cairo:wght@400;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "text/javascript",
        children: `(function(){var host="www.themoneytizer.com";var element=document.createElement('script');var firstScript=document.getElementsByTagName('script')[0];var url='https://cmp.inmobi.com'.concat('/choice/','6Fv0cGNfc_bw8','/',host,'/choice.js?tag_version=V3');var uspTries=0;var uspTriesLimit=3;element.async=true;element.type='text/javascript';element.src=url;firstScript.parentNode.insertBefore(element,firstScript);function makeStub(){var TCF_LOCATOR_NAME='__tcfapiLocator';var queue=[];var win=window;var cmpFrame;function addFrame(){var doc=win.document;var otherCMP=!!(win.frames[TCF_LOCATOR_NAME]);if(!otherCMP){if(doc.body){var iframe=doc.createElement('iframe');iframe.style.cssText='display:none';iframe.name=TCF_LOCATOR_NAME;doc.body.appendChild(iframe);}else{setTimeout(addFrame,5);}}return !otherCMP;}function tcfAPIHandler(){var gdprApplies;var args=arguments;if(!args.length){return queue;}else if(args[0]==='setGdprApplies'){if(args.length>3&&args[2]===2&&typeof args[3]==='boolean'){gdprApplies=args[3];if(typeof args[2]==='function'){args[2]('set',true);}}}else if(args[0]==='ping'){var retr={gdprApplies:gdprApplies,cmpLoaded:false,cmpStatus:'stub'};if(typeof args[2]==='function'){args[2](retr);}}else{if(args[0]==='init'&&typeof args[3]==='object'){args[3]=Object.assign(args[3],{tag_version:'V3'});}queue.push(args);}}function postMessageEventHandler(event){var msgIsString=typeof event.data==='string';var json={};try{json=msgIsString?JSON.parse(event.data):event.data;}catch(ignore){}var payload=json.__tcfapiCall;if(payload){window.__tcfapi(payload.command,payload.version,function(retValue,success){var returnMsg={__tcfapiReturn:{returnValue:retValue,success:success,callId:payload.callId}};if(msgIsString){returnMsg=JSON.stringify(returnMsg);}if(event&&event.source&&event.source.postMessage){event.source.postMessage(returnMsg,'*');}},payload.parameter);}}while(win){try{if(win.frames[TCF_LOCATOR_NAME]){cmpFrame=win;break;}}catch(ignore){}if(win===window.top){break;}win=win.parent;}if(!cmpFrame){addFrame();win.__tcfapi=tcfAPIHandler;win.addEventListener('message',postMessageEventHandler,false);}}makeStub();var uspStubFunction=function(){var arg=arguments;if(typeof window.__uspapi!==uspStubFunction){setTimeout(function(){if(typeof window.__uspapi!=='undefined'){window.__uspapi.apply(window.__uspapi,arg);}},500);}};var checkIfUspIsReady=function(){uspTries++;if(window.__uspapi===uspStubFunction&&uspTries<uspTriesLimit){console.warn('USP is not accessible');}else{clearInterval(uspInterval);}};if(typeof window.__uspapi==='undefined'){window.__uspapi=uspStubFunction;var uspInterval=setInterval(checkIfUspIsReady,6000);}})();`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Devoiratouna",
          url: "/",
          description: "Plateforme éducative tunisienne gratuite",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthSync() {
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED") {
        router.invalidate();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthSync />
        <TopBanner />
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 min-h-[calc(100vh-180px)]">
          <Outlet />
        </main>
        <Footer />
        <Toaster richColors position="top-center" />
        <CookieBanner />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
