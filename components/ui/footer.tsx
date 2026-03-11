import Link from 'next/link'
import Image from 'next/image'

const links = [
  { title: 'How It Works', href: '#features' },
  { title: 'Feed Preview', href: '#feed-preview' },
  { title: 'Start Here', href: '#cta' },
]

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/lightsoft_crew/',
    icon: (
      <svg
        className="size-5"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"
        />
      </svg>
    ),
  },
  {
    label: 'Threads',
    href: 'https://www.threads.com/@lightsoft_crew',
    icon: (
      <svg
        className="size-5"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M19.25 8.505c-1.577-5.867-7-5.5-7-5.5s-7.5-.5-7.5 8.995s7.5 8.996 7.5 8.996s4.458.296 6.5-3.918c.667-1.858.5-5.573-6-5.573c0 0-3 0-3 2.5c0 .976 1 2 2.5 2s3.171-1.027 3.5-3c1-6-4.5-6.5-6-4"
          color="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/lightsoft-dev',
    icon: (
      <svg
        className="size-5"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
        />
      </svg>
    ),
  },
]

export default function FooterSection() {
  return (
    <footer className="border-t border-white/10 bg-black py-16">
      <div className="mx-auto max-w-5xl px-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="go home"
          className="mx-auto flex w-fit items-center gap-3">
          <div className="relative size-8 overflow-hidden rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.14)] ring-1 ring-white/20">
            <Image
              src="/favicon-32x32.png"
              alt="Motion Meme logo"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
          <span className="text-base font-black uppercase tracking-[0.28em] text-white">
            Motion Meme
          </span>
        </Link>

        {/* Navigation links */}
        <div className="my-8 flex flex-wrap justify-center gap-6">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="block text-zinc-400 transition-colors duration-150 hover:text-white">
              <span>{link.title}</span>
            </Link>
          ))}
        </div>

        {/* Social links */}
        <div className="my-8 flex flex-wrap justify-center gap-6">
          {socialLinks.map((social) => (
            <Link
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="block text-zinc-500 transition-colors duration-150 hover:text-white">
              {social.icon}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <span className="block text-center text-sm text-zinc-600">
          © {new Date().getFullYear()} Lightsoft. All rights reserved.
        </span>
      </div>
    </footer>
  )
}
