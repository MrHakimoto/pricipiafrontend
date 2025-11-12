// components/AulaContent.tsx
export function AulaContent({ data }) {
  const [videoLoading, setVideoLoading] = useState(true);
  
  return (
    <div>
      {/* 🔥 PLAYER COM ANIMAÇÕES ORIGINAIS */}
      <motion.div
        layout
        className="mb-6"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {videoLoading && <Skeleton className="w-full aspect-video" />}
        {data.content_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <iframe
              src={data.content_url}
              className={`w-full aspect-video border-0 rounded-lg ${videoLoading ? 'hidden' : 'block'}`}
              onLoad={() => setVideoLoading(false)}
            />
          </motion.div>
        )}
      </motion.div>

      {/* 🔥 BOTÕES ORIGINAIS */}
      <motion.div
        className="w-full mt-4 flex flex-col gap-4"
        layout
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Seus botões originais aqui */}
      </motion.div>
    </div>
  );
}