export function PdfViewer({ src, title }: { src: string; title?: string }) {
  return (
    <iframe
      src={src}
      title={title ?? "PDF"}
      className="w-full h-[calc(100vh-200px)] min-h-[500px] rounded-lg border border-white/10 bg-black/30"
      allow="fullscreen"
    />
  );
}

export function YoutubeEmbed({ src, title }: { src: string; title?: string }) {
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black/40">
      <iframe
        src={src}
        title={title ?? "Vidéo"}
        className="w-full h-full"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
