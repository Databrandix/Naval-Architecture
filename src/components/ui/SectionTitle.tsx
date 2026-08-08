interface SectionTitleProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  dark?: boolean;
  centered?: boolean;
}

export default function SectionTitle({title, subtitle, eyebrow = 'Academic Excellence', dark = false, centered = false}: SectionTitleProps) {
  return (
    <div className={`mb-6 md:mb-8 space-y-3 ${centered ? 'text-center' : ''}`}>
      <div className={`flex items-center gap-3 mb-2 ${centered ? 'justify-center' : ''}`}>
        <span className="w-10 h-[1.5px] bg-accent/40" />
        <span className="text-accent font-bold tracking-[0.2em] uppercase text-[10px]">{eyebrow}</span>
      </div>
      <h2 className={`text-[24px] md:text-3xl lg:text-5xl lg:leading-[1.1] font-display font-bold leading-tight ${dark ? 'text-white' : 'text-primary'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base md:text-lg max-w-3xl font-light leading-relaxed ${centered ? 'mx-auto' : ''} ${dark ? 'text-white/70' : 'text-secondary-dark/60'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
