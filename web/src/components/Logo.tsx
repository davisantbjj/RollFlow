export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={`font-display uppercase tracking-widest ${size === 'lg' ? 'text-5xl' : 'text-3xl'}`}>
      Roll<span className="text-gold">Flow</span>
    </span>
  );
}
