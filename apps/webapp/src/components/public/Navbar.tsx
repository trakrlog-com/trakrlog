import { useState, useEffect } from 'react'
import { Button, Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const navigation = [
  { name: 'App', href: '/dashboard' },
  { name: 'Docs', href: '/docs' },
  { name: 'Get Started', href: '/get-started' },
]

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 mx-auto backdrop-blur-sm 
        transition-[border] duration-100 ${isScrolled ? 'border-b border-white/10 bg-[var(--dark-bg)]/90' : ''} `}>
      <nav aria-label="Global" className="flex items-center justify-between p-3 lg:px-8 max-w-[1500px] mx-auto">
        <div className="flex lg:flex-1">
          <a href="/" className=" flex items-center mt-1">
            <img
              alt="TrakrLog logo"
              src="/logo-big.png"
              className="h-8 w-auto"
            />
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12 ">
          {navigation.map((item) => (
            <a key={item.name} href={item.href} className="text-md font-semibold text-white">
              {item.name}
            </a>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Button onClick={() => navigate('/login')}  className="main-button h-8">
            Login
          </Button>
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-100/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <img
                alt="TrakrLog logo"
                src="/logo.png"
                className="h-8 w-auto"
              />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-200"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-white/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/5"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <div className="py-6">
                <button
                  onClick={() => navigate('/login')}
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white hover:bg-white/5"
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}