export function DocsLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size * 0.77}
      height={size}
      viewBox="0 0 40 52"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path fill="#4285F4" d="M27.5 0H4.5C2 0 0 2 0 4.5v43C0 50 2 52 4.5 52h31c2.5 0 4.5-2 4.5-4.5V12.5L27.5 0z" />
      <path fill="#A1C2FA" d="M27.5 0v12.5H40L27.5 0z" />
      <path fill="#F1F1F1" d="M10 25h20v2.6H10V25zm0 6.4h20V34H10v-2.6zm0 6.4h13.4v2.6H10v-2.6z" />
    </svg>
  )
}

export function DocsLogoWithText() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <DocsLogo size={38} />
      <span className="text-[22px] leading-none text-[#5f6368] mt-2.5" style={{ fontFamily: 'Arial, sans-serif' }}>
        Docs
      </span>
    </div>
  )
}
